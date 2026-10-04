package com.innerview.spring.service.impl;

import static org.assertj.core.api.Assertions.assertThat;

import com.innerview.spring.entity.Feedback;
import com.innerview.spring.entity.Interview;
import com.innerview.spring.entity.User;
import com.innerview.spring.entity.UserInterview;
import com.innerview.spring.entity.UserStats;
import com.innerview.spring.enums.InterviewRole;
import com.innerview.spring.enums.InterviewStatus;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;

/** Runs the real aggregate queries against the test database. */
@DataJpaTest
@Import(UserStatsService.class)
class UserStatsServiceTest {
  @Autowired UserStatsService service;
  @Autowired TestEntityManager db;

  @Test
  void computesRatingsAndCompletedInterviewsByRole() {
    User candidate = user("candidate");
    User interviewer = user("interviewer");
    User observer = user("observer");

    Interview completed = interview(InterviewStatus.COMPLETED);
    join(candidate, completed, InterviewRole.INTERVIEWEE);
    join(interviewer, completed, InterviewRole.INTERVIEWER);
    join(observer, completed, InterviewRole.OBSERVER);
    Interview live = interview(InterviewStatus.STARTED);
    join(candidate, live, InterviewRole.INTERVIEWEE);

    review(completed, interviewer, candidate, 5);
    review(completed, observer, candidate, 4);
    review(completed, candidate, interviewer, 3);
    db.flush();

    service.recompute(List.of(candidate.getId(), interviewer.getId(), observer.getId()));
    db.flush();
    db.clear();

    UserStats c = service.statsFor(candidate.getId());
    assertThat(c.averageRating()).isEqualTo(4.5);
    assertThat(c.getRatingCount()).isEqualTo(2);
    assertThat(c.getCompletedInterviews()).as("the live interview doesn't count yet").isEqualTo(1);
    assertThat(c.getInterviewsAsCandidate()).isEqualTo(1);
    assertThat(c.getInterviewsAsInterviewer()).isZero();

    UserStats i = service.statsFor(interviewer.getId());
    assertThat(i.averageRating()).isEqualTo(3.0);
    assertThat(i.getInterviewsAsInterviewer()).isEqualTo(1);

    UserStats o = service.statsFor(observer.getId());
    assertThat(o.getCompletedInterviews()).as("observers don't get interview credit").isZero();
    assertThat(o.averageRating()).isNull();
  }

  @Test
  void recomputingIsIdempotentAndUnknownUsersReadAsZero() {
    User user = user("solo");
    db.flush();
    service.recompute(List.of(user.getId()));
    service.recompute(List.of(user.getId()));
    db.flush();

    assertThat(service.statsFor(user.getId()).getCompletedInterviews()).isZero();
    assertThat(service.statsFor(UUID.randomUUID()).averageRating()).isNull();
  }

  private User user(String name) {
    User user = new User();
    user.setName(name);
    user.setEmail(name + "-" + UUID.randomUUID() + "@example.com");
    user.setPasswordHash("hash");
    user.setForgotPasswordCount(0);
    return db.persist(user);
  }

  private Interview interview(InterviewStatus status) {
    Interview interview = new Interview();
    interview.setStatus(status);
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
