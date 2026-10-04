package com.innerview.spring.enums;

public enum RoomParticipantStatus {
  /** At least one live socket session. */
  CONNECTED,
  /** All sessions dropped; kept in the room for a short grace period (network blip, reload). */
  RECONNECTING,
  /** Left, or didn't come back within the grace period. Can rejoin without asking again. */
  LEFT
}
