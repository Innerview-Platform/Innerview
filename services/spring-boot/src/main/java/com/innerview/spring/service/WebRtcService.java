package com.innerview.spring.service;

import com.innerview.spring.dto.SignalingMessage;
import com.innerview.spring.entity.ActiveRoom;
import java.util.UUID;

public interface WebRtcService {

  void handleSignal(String roomId, SignalingMessage signalingMessage);
}
