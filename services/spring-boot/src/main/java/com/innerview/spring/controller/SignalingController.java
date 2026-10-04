package com.innerview.spring.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.innerview.spring.core.config.StompPrincipal;
import com.innerview.spring.dto.RunCodeSignalPayload;
import com.innerview.spring.dto.SignalingMessage;
import com.innerview.spring.entity.RoomParticipant;
import com.innerview.spring.enums.InterviewRole;
import com.innerview.spring.exception.ApiException;
import com.innerview.spring.service.CodeRunnerService;
import com.innerview.spring.service.RoomService;
import com.innerview.spring.service.WebRtcService;
import java.security.Principal;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;

/**
 * Real-time messages sent to /app/signal.send. The session was authenticated with a room ticket
 * at CONNECT; every message is re-checked against the user's current membership, so removed users
 * and people who left can't act.
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class SignalingController {

  private final RoomService roomService;
  private final CodeRunnerService codeRunnerService;
  private final WebRtcService webRtcService;
  private final ObjectMapper objectMapper;

  @MessageMapping("/signal.send")
  public void handleRoomSignals(@Payload SignalingMessage message, Principal principal) {
    StompPrincipal stomp = (StompPrincipal) principal;
    String room = stomp.getRoomId();
    RoomParticipant me = roomService.requireActiveParticipant(room, stomp.getUserId());
    String type = message.getType() == null ? "" : message.getType();

    switch (type) {
      case "RUN_CODE" -> {
        requireEditor(me);
        codeRunnerService.run(room, me.getUserId(), objectMapper.convertValue(message.getPayload(), RunCodeSignalPayload.class));
      }
      case "RUN_STDIN" -> {
        requireEditor(me);
        codeRunnerService.sendInput(room, me.getUserId(), stringField(message.getPayload(), "data"));
      }
      case "RUN_STOP" -> {
        requireEditor(me);
        codeRunnerService.stop(room, me.getUserId());
      }
      case "RUN_LANGUAGE" -> {
        requireEditor(me);
        codeRunnerService.changeLanguage(room, me.getUserId(), stringField(message.getPayload(), "language"));
      }
      case "RUN_SYNC" -> codeRunnerService.broadcastState(room);
      case "CHAT_SEND" -> roomService.sendChat(room, me.getUserId(), stringField(message.getPayload(), "text"));
      case "OFFER", "ANSWER", "ICE_CANDIDATE" -> webRtcService.handleSignal(room, message);
      case "JOIN" -> {
        // Presence is tracked at CONNECT; kept for older clients.
      }
      default -> throw ApiException.badRequest("UNKNOWN_MESSAGE", "Unknown message type: " + type);
    }
  }

  /** Rejected actions go back to the sender only, on /user/queue/errors. */
  @MessageExceptionHandler
  @SendToUser(destinations = "/queue/errors", broadcast = false)
  public Map<String, String> handleError(Exception e) {
    if (e instanceof ApiException api) return Map.of("code", api.getCode(), "message", api.getMessage());
    log.warn("[Signaling] {}", e.getMessage());
    return Map.of("code", "ERROR", "message", "That action failed");
  }

  private static void requireEditor(RoomParticipant me) {
    if (me.getRole() == InterviewRole.OBSERVER) throw ApiException.forbidden("READ_ONLY", "Observers can't run code");
  }

  private static String stringField(Object payload, String field) {
    if (payload instanceof Map<?, ?> map && map.get(field) instanceof String value) return value;
    return null;
  }
}
