package com.innerview.spring.service.impl;

import com.innerview.spring.dto.SignalingMessage;
import com.innerview.spring.entity.ActiveRoom;
import com.innerview.spring.service.WebRtcService;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/** WebRtcP2pImpl */
@Service
@RequiredArgsConstructor
public class WebRtcP2pImpl implements WebRtcService {
  private final SimpMessagingTemplate messagingTemplate;

  @Override
  public void handleSignal(String roomId, SignalingMessage signalingMessage) {
    messagingTemplate.convertAndSend("/topic/room/" + roomId + "/videocall", signalingMessage);
  }
}
