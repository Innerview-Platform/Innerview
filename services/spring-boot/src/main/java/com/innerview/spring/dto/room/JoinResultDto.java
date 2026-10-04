package com.innerview.spring.dto.room;

/** Result of entering a room: a room ticket for the live services and the current room state. */
public record JoinResultDto(String ticket, RoomStateDto room, MeDto me, boolean alreadyConnected) {
  /** The joining user's own permissions. */
  public record MeDto(String role, boolean host, boolean staff, boolean readonly) {}
}
