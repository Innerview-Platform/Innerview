package com.innerview.spring.core.util;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Users whose still-valid access tokens must stop working (deleted accounts). JwtFilter checks this
 * without a database query; entries expire once every token issued before revocation has expired.
 * In memory, which is fine because the backend runs as a single instance (see RateLimiter).
 */
@Component
public class RevokedUsers {
  private final ConcurrentHashMap<UUID, Instant> revokedUntil = new ConcurrentHashMap<>();
  private final Duration tokenLifetime;

  public RevokedUsers(@Value("${jwt.access-token.expiration}") long accessTokenMillis) {
    this.tokenLifetime = Duration.ofMillis(accessTokenMillis).plusMinutes(1);
  }

  public void revoke(UUID userId) {
    revokedUntil.put(userId, Instant.now().plus(tokenLifetime));
  }

  public boolean isRevoked(UUID userId) {
    Instant until = revokedUntil.get(userId);
    return until != null && until.isAfter(Instant.now());
  }

  @Scheduled(fixedDelay = 600_000)
  void evictExpired() {
    Instant now = Instant.now();
    revokedUntil.values().removeIf(until -> until.isBefore(now));
  }
}
