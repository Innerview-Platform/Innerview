package com.innerview.spring.core.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.innerview.spring.exception.ApiException;
import org.junit.jupiter.api.Test;

class UsernameRulesTest {

  @Test
  void normalizesToLowercase() {
    assertThat(UsernameRules.validate("  Mostafa.Dev ")).isEqualTo("mostafa.dev");
  }

  @Test
  void acceptsValidUsernames() {
    for (String ok : new String[] {"abc", "jane_doe", "j-d.42", "a1b", "x".repeat(30)}) {
      assertThat(UsernameRules.formatProblem(ok)).as(ok).isEmpty();
    }
  }

  @Test
  void rejectsBadFormatsAndReservedNames() {
    for (String bad : new String[] {"ab", "x".repeat(31), "_jane", "jane.", "ja ne", "jane..doe", "jane_-doe",
        "jäne", "jane@x", "me", "admin", "settings", "languages"}) {
      assertThat(UsernameRules.formatProblem(bad)).as(bad).isPresent();
    }
    assertThatThrownBy(() -> UsernameRules.validate("me"))
        .isInstanceOf(ApiException.class).extracting("code").isEqualTo("INVALID_USERNAME");
  }
}
