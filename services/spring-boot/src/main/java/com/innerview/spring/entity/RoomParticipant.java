package com.innerview.spring.entity;

import com.innerview.spring.enums.InterviewRole;
import com.innerview.spring.enums.RoomParticipantStatus;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import lombok.Data;

/** Someone admitted to a live room (in memory). Presence is derived from their socket sessions. */
@Data
public class RoomParticipant {
  private UUID userId;
  private String name;
  /** Null for accounts without a username yet. */
  private String username;
  private String avatarThumbUrl;
  private InterviewRole role;
  private volatile RoomParticipantStatus status = RoomParticipantStatus.LEFT;
  /** First time they entered this room. */
  private Instant joinedAt;
  /** When RECONNECTING started; LEFT once the grace period passes. */
  private volatile Instant disconnectedAt;
  /** STOMP session id → client (tab) id. */
  private final Map<String, String> sessions = new ConcurrentHashMap<>();

  public boolean isActive() {
    return status != RoomParticipantStatus.LEFT;
  }
}
