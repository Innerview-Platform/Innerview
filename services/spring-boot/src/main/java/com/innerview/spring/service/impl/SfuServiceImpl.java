package com.innerview.spring.service.impl;

import com.innerview.spring.dto.SfuAccessTokenDto;
import com.innerview.spring.entity.RoomParticipant;
import com.innerview.spring.enums.InterviewRole;
import com.innerview.spring.service.SfuService;
import io.livekit.server.AccessToken;
import io.livekit.server.CanPublish;
import io.livekit.server.CanPublishData;
import io.livekit.server.RoomJoin;
import io.livekit.server.RoomName;
import io.livekit.server.RoomServiceClient;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class SfuServiceImpl implements SfuService {

  private final String apiKey;
  private final String apiSecret;
  private final String serverUrl;

  public SfuServiceImpl(
      @Value("${livekit.api-key:devkey}") String apiKey,
      @Value("${livekit.api-secret:secret}") String apiSecret,
      @Value("${livekit.url:http://localhost:7880}") String serverUrl) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.serverUrl = serverUrl;
  }

  @Override
  public SfuAccessTokenDto generateSfuAccessToken(String roomCode, RoomParticipant participant) {
    AccessToken token = new AccessToken(apiKey, apiSecret);
    // The user id is the identity: LiveKit replaces an older connection with the same identity,
    // so a second tab doesn't show up as a second person.
    token.setIdentity(participant.getUserId().toString());
    token.setName(participant.getName());
    token.addGrants(
        new RoomJoin(true),
        new RoomName(roomCode),
        new CanPublish(participant.getRole() != InterviewRole.OBSERVER),
        new CanPublishData(true));
    return new SfuAccessTokenDto(token.toJwt());
  }

  @Override
  public void removeParticipant(String roomCode, UUID userId) {
    try {
      RoomServiceClient.Companion.createClient(serverUrl, apiKey, apiSecret)
          .removeParticipant(roomCode, userId.toString())
          .execute();
    } catch (Exception e) {
      log.warn("[LiveKit] Could not remove {} from {}: {}", userId, roomCode, e.getMessage());
    }
  }
}
