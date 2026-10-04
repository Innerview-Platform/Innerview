package com.innerview.spring.core.config;

import java.security.Principal;
import java.util.UUID;

/**
 * The authenticated STOMP session: who, in which room (from their room ticket), from which tab.
 * {@link #getName()} is the user id, which is what user destinations ({@code /user/queue/...}) use.
 */
public class StompPrincipal implements Principal {
  private final UUID userId;
  private final String roomId;
  private final String clientId;

  public StompPrincipal(UUID userId, String roomId, String clientId) {
    this.userId = userId;
    this.roomId = roomId;
    this.clientId = clientId;
  }

  @Override
  public String getName() {
    return userId.toString();
  }

  public UUID getUserId() {
    return userId;
  }

  public String getRoomId() {
    return roomId;
  }

  public String getClientId() {
    return clientId;
  }
}
