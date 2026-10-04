package com.innerview.spring.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.innerview.spring.core.config.PasswordEncoderConfig;
import com.innerview.spring.core.util.RevokedUsers;
import com.innerview.spring.dto.profile.DeleteAccountRequest;
import com.innerview.spring.entity.Feedback;
import com.innerview.spring.entity.Interview;
import com.innerview.spring.entity.RefreshToken;
import com.innerview.spring.entity.StoredFile;
import com.innerview.spring.entity.User;
import com.innerview.spring.entity.UserInterview;
import com.innerview.spring.entity.UserProfile;
import com.innerview.spring.entity.UserStats;
import com.innerview.spring.enums.InterviewRole;
import com.innerview.spring.enums.InterviewStatus;
import com.innerview.spring.enums.StoredFileEncoding;
import com.innerview.spring.enums.StoredFileKind;
import com.innerview.spring.exception.ApiException;
import java.time.LocalDateTime;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.password.PasswordEncoder;

/** Runs the deletion against the test database. */
@DataJpaTest
@Import({AccountDeletionService.class, RevokedUsers.class, PasswordEncoderConfig.class})
class AccountDeletionServiceTest {
  @Autowired AccountDeletionService service;
  @Autowired RevokedUsers revokedUsers;
  @Autowired PasswordEncoder passwordEncoder;
  @Autowired TestEntityManager db;

  private User me;
  private User partner;
  private Interview completed;
  private Interview scheduled;

  @BeforeEach
  void setUp() {
    me = user("leaving", passwordEncoder.encode("Secret1!"));
    partner = user("staying", "hash");
    UserProfile profile = new UserProfile();
    profile.setUser(me);
    profile.setUniversity("Cairo University");
    db.persist(profile);
    StoredFile resume = new StoredFile();
    resume.setOwner(me);
    resume.setKind(StoredFileKind.RESUME);
    resume.setContentType("application/pdf");
    resume.setSizeOriginal(1);
    resume.setSizeStored(1);
    resume.setEncoding(StoredFileEncoding.IDENTITY);
    resume.setSha256("x");
    resume.setData(new byte[] {1});
    db.persist(resume);
    db.persist(new UserStats(me.getId()));
    RefreshToken token = new RefreshToken();
    token.setToken("refresh-" + UUID.randomUUID());
    token.setExpiresAt(LocalDateTime.now().plusDays(1));
    token.setCreatedAt(LocalDateTime.now());
    token.setRevoked(false);
    token.setUser(me);
    db.persist(token);

    completed = interview(InterviewStatus.COMPLETED, partner.getId());
    join(me, completed, InterviewRole.INTERVIEWEE);
    join(partner, completed, InterviewRole.INTERVIEWER);
    review(completed, partner, me, 4); // about me: removed
    review(completed, me, partner, 5); // written by me: kept, anonymous
    scheduled = interview(InterviewStatus.SCHEDULED, me.getId());
    db.flush();
  }

  @Test
  void erasesPersonalDataAndKeepsSharedHistoryAnonymous() {
    service.deleteAccount(me.getId(), new DeleteAccountRequest("@Leaving", "Secret1!"));
    db.flush();
    db.clear();

    User row = db.find(User.class, me.getId());
    assertThat(row.getName()).isEqualTo("Deleted user");
    assertThat(row.getUsername()).isNull();
    assertThat(row.getEmail()).endsWith("@deleted.invalid");
    assertThat(passwordEncoder.matches("Secret1!", row.getPasswordHash())).isFalse();
    assertThat(row.getDeletedAt()).isNotNull();

    assertThat(count("SELECT COUNT(p) FROM UserProfile p WHERE p.user.id = :id")).isZero();
    assertThat(count("SELECT COUNT(f) FROM StoredFile f WHERE f.owner.id = :id")).isZero();
    assertThat(count("SELECT COUNT(t) FROM RefreshToken t WHERE t.user.id = :id")).isZero();
    assertThat(count("SELECT COUNT(s) FROM UserStats s WHERE s.userId = :id")).isZero();
    assertThat(count("SELECT COUNT(f) FROM Feedback f WHERE f.reviewee.id = :id")).as("reviews about me").isZero();
    assertThat(count("SELECT COUNT(f) FROM Feedback f WHERE f.reviewer.id = :id")).as("reviews I wrote").isEqualTo(1);
    assertThat(count("SELECT COUNT(ui) FROM UserInterview ui WHERE ui.user.id = :id")).as("interview history").isEqualTo(1);
    assertThat(db.find(Interview.class, scheduled.getId()).getStatus()).isEqualTo(InterviewStatus.CANCELLED);
    assertThat(db.find(Interview.class, completed.getId()).getStatus()).isEqualTo(InterviewStatus.COMPLETED);
    assertThat(revokedUsers.isRevoked(me.getId())).isTrue();
  }

  @Test
  void requiresTheUsernameAndPassword() {
    assertCode(() -> service.deleteAccount(me.getId(), new DeleteAccountRequest("staying", "Secret1!")), "CONFIRMATION_MISMATCH");
    assertCode(() -> service.deleteAccount(me.getId(), new DeleteAccountRequest("leaving", "wrong")), "WRONG_PASSWORD");
    assertCode(() -> service.deleteAccount(me.getId(), new DeleteAccountRequest("leaving", null)), "WRONG_PASSWORD");
    assertThat(db.find(User.class, me.getId()).getDeletedAt()).isNull();
  }

  @Test
  void refusesDuringALiveInterview() {
    Interview live = interview(InterviewStatus.STARTED, partner.getId());
    join(me, live, InterviewRole.INTERVIEWEE);
    db.flush();
    assertCode(() -> service.deleteAccount(me.getId(), new DeleteAccountRequest("leaving", "Secret1!")), "IN_LIVE_INTERVIEW");
  }

  @Test
  void aDeletedAccountCantBeDeletedAgain() {
    service.deleteAccount(me.getId(), new DeleteAccountRequest("leaving", "Secret1!"));
    db.flush();
    assertCode(() -> service.deleteAccount(me.getId(), new DeleteAccountRequest("leaving", "Secret1!")), "NOT_FOUND");
  }

  private long count(String jpql) {
    return db.getEntityManager().createQuery(jpql, Long.class).setParameter("id", me.getId()).getSingleResult();
  }

  private static void assertCode(org.assertj.core.api.ThrowableAssert.ThrowingCallable call, String code) {
    assertThatThrownBy(call).isInstanceOf(ApiException.class).extracting("code").isEqualTo(code);
  }

  private User user(String username, String passwordHash) {
    User user = new User();
    user.setName(username);
    user.setUsername(username);
    user.setEmail(username + "-" + UUID.randomUUID() + "@example.com");
    user.setPasswordHash(passwordHash);
    user.setForgotPasswordCount(0);
    return db.persist(user);
  }

  private Interview interview(InterviewStatus status, UUID ownerId) {
    Interview interview = new Interview();
    interview.setStatus(status);
    interview.setOwnerId(ownerId);
    return db.persist(interview);
  }

  private void join(User user, Interview interview, InterviewRole role) {
    UserInterview participation = new UserInterview();
    participation.setUser(user);
    participation.setInterview(interview);
    participation.setRole(role);
    db.persist(participation);
  }

  private void review(Interview interview, User reviewer, User reviewee, int rating) {
    Feedback feedback = new Feedback();
    feedback.setInterview(interview);
    feedback.setReviewer(reviewer);
    feedback.setReviewee(reviewee);
    feedback.setRating(rating);
    db.persist(feedback);
  }
}
