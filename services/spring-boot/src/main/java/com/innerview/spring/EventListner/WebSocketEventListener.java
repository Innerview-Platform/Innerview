package com.innerview.spring.EventListner;

import com.innerview.spring.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

/** Socket closed (tab closed, network lost, heartbeat timeout): update presence. */
@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

  private final RoomService roomService;

  @EventListener
  public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
    roomService.disconnect(event.getSessionId());
  }
}
