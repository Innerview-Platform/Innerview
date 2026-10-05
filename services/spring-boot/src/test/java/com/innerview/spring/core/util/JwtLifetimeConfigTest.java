package com.innerview.spring.core.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.springframework.boot.convert.ApplicationConversionService;

/**
 * jwt.*.expiration are read as Durations. Both the readable form ("15m", "7d") and the old plain
 * milliseconds ("900000", e.g. from an existing .env) must keep working.
 */
class JwtLifetimeConfigTest {
  private final ApplicationConversionService conversion = new ApplicationConversionService();

  @Test
  void acceptsReadableDurations() {
    assertThat(conversion.convert("15m", Duration.class)).isEqualTo(Duration.ofMinutes(15));
    assertThat(conversion.convert("7d", Duration.class)).isEqualTo(Duration.ofDays(7));
    assertThat(conversion.convert("30d", Duration.class)).isEqualTo(Duration.ofDays(30));
  }

  @Test
  void stillAcceptsPlainMilliseconds() {
    assertThat(conversion.convert("900000", Duration.class)).isEqualTo(Duration.ofMinutes(15));
    assertThat(conversion.convert("604800000", Duration.class)).isEqualTo(Duration.ofDays(7));
  }

  @Test
  void revokedUsersCoverTheWholeAccessTokenLifetime() {
    RevokedUsers revoked = new RevokedUsers(Duration.ofMinutes(15));
    java.util.UUID user = java.util.UUID.randomUUID();
    revoked.revoke(user);
    assertThat(revoked.isRevoked(user)).isTrue();
  }
}
