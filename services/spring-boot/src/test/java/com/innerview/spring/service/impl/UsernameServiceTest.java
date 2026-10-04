package com.innerview.spring.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.innerview.spring.entity.User;
import com.innerview.spring.exception.ApiException;
import com.innerview.spring.repository.UserRepository;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UsernameServiceTest {
  @Mock UserRepository users;
  @InjectMocks UsernameService service;

  private static User user(String username) {
    User user = new User();
    user.setId(UUID.randomUUID());
    user.setUsername(username);
    return user;
  }

  @Test
  void reportsFreeTakenAndInvalidNames() {
    User owner = user("taken");
    when(users.findByUsername("taken")).thenReturn(Optional.of(owner));
    when(users.findByUsername("free")).thenReturn(Optional.empty());

    assertThat(service.check("Free", null).available()).isTrue();
    assertThat(service.check("free", null).username()).isEqualTo("free");
    assertThat(service.check("TAKEN", null)).satisfies(r -> {
      assertThat(r.available()).isFalse();
      assertThat(r.reason()).contains("taken");
    });
    assertThat(service.check("taken", owner.getId()).available()).as("your own username").isTrue();
    assertThat(service.check("a", null).available()).isFalse();
  }

  @Test
  void assignsNormalizedUsernamesAndRejectsTakenOnes() {
    User me = user(null);
    when(users.findByUsername("jane")).thenReturn(Optional.empty());
    service.assign(me, " Jane ");
    assertThat(me.getUsername()).isEqualTo("jane");

    when(users.findByUsername("omar")).thenReturn(Optional.of(user("omar")));
    assertThatThrownBy(() -> service.assign(me, "omar"))
        .isInstanceOf(ApiException.class).extracting("code").isEqualTo("USERNAME_TAKEN");
    assertThat(me.getUsername()).isEqualTo("jane");
  }

  @Test
  void newUsersWithoutIdsCannotTakeAnExistingName() {
    User newUser = new User();
    when(users.findByUsername("omar")).thenReturn(Optional.of(user("omar")));
    assertThatThrownBy(() -> service.assign(newUser, "omar")).isInstanceOf(ApiException.class);
  }
}
