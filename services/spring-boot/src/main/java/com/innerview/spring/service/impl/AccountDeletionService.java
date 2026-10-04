package com.innerview.spring.service.impl;

import com.innerview.spring.core.util.RevokedUsers;
import com.innerview.spring.dto.profile.DeleteAccountRequest;
import com.innerview.spring.entity.Interview;
import com.innerview.spring.entity.User;
import com.innerview.spring.enums.InterviewStatus;
import com.innerview.spring.exception.ApiException;
import com.innerview.spring.repository.FeedbackRepository;
import com.innerview.spring.repository.InterviewRepository;
import com.innerview.spring.repository.RefreshTokenRepository;
import com.innerview.spring.repository.StoredFileRepository;
import com.innerview.spring.repository.UserInterviewRepository;
import com.innerview.spring.repository.UserLanguageRepository;
import com.innerview.spring.repository.UserProfileRepository;
import com.innerview.spring.repository.UserRepository;
import com.innerview.spring.repository.UserStatsRepository;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Deletes an account by erasing its personal data and anonymizing the user row. The row itself stays
 * because other people's interview history and the reviews this user wrote point at it; those now
 * show "Deleted user". Nothing left can identify the person or be used to sign in.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AccountDeletionService {
  static final String DELETED_NAME = "Deleted user";

  private final UserRepository users;
  private final UserProfileRepository profiles;
  private final StoredFileRepository storedFiles;
  private final UserLanguageRepository languages;
  private final RefreshTokenRepository refreshTokens;
  private final FeedbackRepository feedback;
  private final UserStatsRepository stats;
  private final UserInterviewRepository userInterviews;
  private final InterviewRepository interviews;
  private final PasswordEncoder passwordEncoder;
  private final RevokedUsers revokedUsers;

  @Transactional
  public void deleteAccount(UUID userId, DeleteAccountRequest request) {
    User user = users.findById(userId)
        .filter(u -> u.getDeletedAt() == null)
        .orElseThrow(() -> ApiException.notFound("Account not found"));
    verify(user, request);
    if (userInterviews.isInLiveInterview(userId)) {
      throw ApiException.conflict("IN_LIVE_INTERVIEW", "Leave or end your running interview before deleting your account.");
    }

    // Interviews this user scheduled can't happen without them.
    for (Interview interview : interviews.findByOwnerIdOrderByCreatedAtDesc(userId)) {
      if (interview.getStatus() == InterviewStatus.SCHEDULED) interview.setStatus(InterviewStatus.CANCELLED);
    }

    profiles.getUserProfileByUser_Id(userId).ifPresent(profiles::delete);
    profiles.flush();
    storedFiles.deleteAllByOwner(userId);
    languages.deleteAll(languages.findAllByIdUserId(userId));
    feedback.deleteAllAbout(userId);
    stats.deleteById(userId);
    refreshTokens.deleteByUser(user);

    // Reload: the bulk deletes above cleared the persistence context.
    User row = users.findById(userId).orElseThrow();
    row.setName(DELETED_NAME);
    row.setEmail("deleted-" + userId + "@deleted.invalid");
    row.setUsername(null);
    row.setPasswordHash("!deleted"); // not a bcrypt hash: no password can ever match it
    row.setAuthProvider("deleted");
    row.setProviderId(null);
    row.setResetPasswordToken(null);
    row.setResetPasswordTokenCreatedAt(null);
    row.setDeletedAt(LocalDateTime.now());
    users.save(row);

    // Access tokens already issued stay valid for a few minutes; make the filter ignore them.
    revokedUsers.revoke(userId);
    log.info("[Account] Deleted account {}", userId);
  }

  private void verify(User user, DeleteAccountRequest request) {
    String expected = user.getUsername() != null ? user.getUsername() : user.getEmail();
    String typed = request.confirmation() == null ? "" : request.confirmation().strip().replaceFirst("^@", "");
    if (!typed.toLowerCase(Locale.ROOT).equals(expected.toLowerCase(Locale.ROOT))) {
      throw ApiException.badRequest(
          "CONFIRMATION_MISMATCH", "Type " + (user.getUsername() != null ? "your username" : "your email") + " exactly to confirm.");
    }
    boolean hasPassword = user.getPasswordHash() != null && !user.getPasswordHash().isBlank();
    if (hasPassword && (request.password() == null || !passwordEncoder.matches(request.password(), user.getPasswordHash()))) {
      throw ApiException.badRequest("WRONG_PASSWORD", "Your password is incorrect.");
    }
  }
}
