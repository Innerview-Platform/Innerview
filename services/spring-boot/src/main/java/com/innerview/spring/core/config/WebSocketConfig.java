package com.innerview.spring.core.config;

import com.innerview.spring.service.RoomService;
import java.security.Principal;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketTransportRegistration;

/**
 * STOMP over WebSocket for interview rooms.
 *
 * <ul>
 *   <li>CONNECT must carry a room ticket (header {@code ticket}, from POST /api/rooms/{code}/join or
 *       /ticket); the session is bound to that user and room. Optional headers: {@code clientId}
 *       (per tab) and {@code takeover: true} ("Join here" from a second tab).
 *   <li>SUBSCRIBE is limited to the session's own room topics and the user's private queues.
 *   <li>Private queues: {@code /user/queue/lobby}, {@code /user/queue/session}, {@code /user/queue/errors}.
 * </ul>
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

  private final RoomService roomService;

  public WebSocketConfig(@Lazy RoomService roomService) {
    this.roomService = roomService;
  }

  @Override
  public void registerStompEndpoints(StompEndpointRegistry registry) {
    registry.addEndpoint("/collab").setAllowedOriginPatterns("*").withSockJS();
  }

  @Override
  public void configureMessageBroker(MessageBrokerRegistry registry) {
    registry.enableSimpleBroker("/topic", "/queue").setHeartbeatValue(new long[] {10_000, 10_000}).setTaskScheduler(heartbeatScheduler());
    registry.setApplicationDestinationPrefixes("/app");
    registry.setUserDestinationPrefix("/user");
  }

  private org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler heartbeatScheduler() {
    var scheduler = new org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler();
    scheduler.setPoolSize(1);
    scheduler.setThreadNamePrefix("stomp-heartbeat-");
    scheduler.initialize();
    return scheduler;
  }

  @Override
  public void configureWebSocketTransport(WebSocketTransportRegistration registration) {
    // Chat, runner events and state updates are small; documents now go through Hocuspocus.
    registration.setMessageSizeLimit(512 * 1024).setSendBufferSizeLimit(2 * 1024 * 1024).setSendTimeLimit(20_000);
  }

  @Override
  public void configureClientInboundChannel(ChannelRegistration registration) {
    registration.interceptors(
        new ChannelInterceptor() {
          @Override
          public Message<?> preSend(Message<?> message, MessageChannel channel) {
            StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
            if (accessor == null || accessor.getCommand() == null) return message;

            if (StompCommand.CONNECT.equals(accessor.getCommand())) {
              StompPrincipal principal =
                  roomService.connect(
                      accessor.getFirstNativeHeader("ticket"),
                      accessor.getSessionId(),
                      accessor.getFirstNativeHeader("clientId"),
                      "true".equals(accessor.getFirstNativeHeader("takeover")));
              accessor.setUser(principal);
              return message;
            }

            if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
              Principal user = accessor.getUser();
              String destination = accessor.getDestination();
              if (!(user instanceof StompPrincipal principal) || destination == null) throw new MessagingException("unauthorized");
              boolean ownRoom = destination.startsWith("/topic/room/" + principal.getRoomId() + "/");
              boolean ownQueue = destination.startsWith("/user/queue/");
              if (!ownRoom && !ownQueue) throw new MessagingException("forbidden-destination");
            }
            return message;
          }
        });
  }
}
