package com.innerview.spring.service.impl;

import com.innerview.spring.core.util.UsernameRules;
import com.innerview.spring.dto.profile.UsernameAvailabilityResponse;
import com.innerview.spring.entity.User;
import com.innerview.spring.exception.ApiException;
import com.innerview.spring.repository.UserRepository;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Checks and assigns usernames. The unique index on users.username is the final guard against races. */
@Service
@RequiredArgsConstructor
public class UsernameService {
  private final UserRepository userRepository;

  /** For live checks while typing; {@code currentUserId} (may be null) keeps your own username "available". */
  @Transactional(readOnly = true)
  public UsernameAvailabilityResponse check(String raw, UUID currentUserId) {
    String username = UsernameRules.normalize(raw);
    Optional<String> problem = UsernameRules.formatProblem(username);
    if (problem.isPresent()) return new UsernameAvailabilityResponse(username, false, problem.get());
    boolean takenBySomeoneElse = userRepository.findByUsername(username)
        .map(owner -> !owner.getId().equals(currentUserId))
        .orElse(false);
    return takenBySomeoneElse
        ? new UsernameAvailabilityResponse(username, false, "This username is already taken.")
        : new UsernameAvailabilityResponse(username, true, null);
  }

  /** Validates {@code raw} and sets it on {@code user}; 400 when malformed, 409 when taken. */
  public void assign(User user, String raw) {
    String username = UsernameRules.validate(raw);
    if (username.equals(user.getUsername())) return;
    Optional<User> owner = userRepository.findByUsername(username);
    if (owner.isPresent() && !owner.get().getId().equals(user.getId())) throw taken();
    user.setUsername(username);
  }

  public static ApiException taken() {
    return ApiException.conflict("USERNAME_TAKEN", "This username is already taken.");
  }
}
