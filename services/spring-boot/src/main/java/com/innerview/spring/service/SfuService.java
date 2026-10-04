package com.innerview.spring.service;

import com.innerview.spring.dto.SfuAccessTokenDto;
import com.innerview.spring.entity.RoomParticipant;

/** LiveKit video/audio. */
public interface SfuService {
  /** A LiveKit token for an active participant of the room (identity = user id). */
  SfuAccessTokenDto generateSfuAccessToken(String roomCode, RoomParticipant participant);

  /** Drops the user's video connection (e.g. removed from the room). Best effort. */
  void removeParticipant(String roomCode, java.util.UUID userId);
}
