package com.innerview.spring.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.innerview.spring.dto.review.ReviewDetailDto;
import com.innerview.spring.dto.review.ReviewSummaryDto;
import com.innerview.spring.entity.Feedback;
import com.innerview.spring.entity.Interview;
import com.innerview.spring.entity.User;
import com.innerview.spring.entity.UserProfile;
import com.innerview.spring.enums.HireSignal;
import com.innerview.spring.enums.InterviewRole;
import com.innerview.spring.enums.InterviewStatus;
import com.innerview.spring.enums.InterviewType;
import com.innerview.spring.exception.ApiException;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;

/** Runs the joined review queries against the test database. */
@DataJpaTest
@Import(ReviewService.class)
class ReviewServiceTest {
  @Autowired ReviewService service;
  @Autowired TestEntityManager db;

  private User candidate;
  private User interviewer;
  private User stranger;
  private UUID interviewerThumb;
  private Feedback aboutCandidate;
  private Feedback aboutInterviewer;

  @BeforeEach
  void setUp() {
    candidate = user("cand", "Candy Date");
    interviewer = user("ivan", "Ivan Viewer");
    stranger = user("stranger", "Stranger");
    interviewerThumb = UUID.randomUUID();
    UserProfile profile = new UserProfile();
    profile.setUser(interviewer);
    profile.setAvatarFileId(UUID.randomUUID());
    profile.setAvatarThumbFileId(interviewerThumb);
    db.persist(profile);

    Interview interview = new Interview();
    interview.setStatus(InterviewStatus.COMPLETED);
    interview.setType(InterviewType.PROBLEM_SOLVING);
    interview.setTitle("Graphs practice");
    db.persist(interview);

    aboutCandidate = review(interview, interviewer, candidate, InterviewRole.INTERVIEWER, 4,
        "Clear communication. " + "Solid approach overall. ".repeat(12),
        Map.of("correctness", 4, "communication", 5, "legacy_metric", 3));
    aboutCandidate.setHireSignal(HireSignal.LEAN_YES);
    aboutInterviewer = review(interview, candidate, interviewer, InterviewRole.INTERVIEWEE, 5, "Great hints", Map.of("clarity", 5));
    db.flush();
  }

  @Test
  void receivedReviewsShowTheReviewersNameAndAvatarNotJustTheirId() {
    Page<ReviewSummaryDto> page = service.received(candidate.getId(), null, 0, 12);

    assertThat(page.getTotalElements()).isEqualTo(1);
    ReviewSummaryDto card = page.getContent().get(0);
    assertThat(card.person().name()).isEqualTo("Ivan Viewer");
    assertThat(card.person().username()).isEqualTo("ivan");
    assertThat(card.person().avatarThumbUrl()).isEqualTo("/api/files/avatars/" + interviewerThumb);
    assertThat(card.interview().title()).isEqualTo("Graphs practice");
    assertThat(card.hireSignal()).isEqualTo(HireSignal.LEAN_YES);
    assertThat(card.excerpt()).endsWith("…").hasSizeLessThanOrEqualTo(ReviewService.EXCERPT_LENGTH + 1);
  }

  @Test
  void givenReviewsShowTheRevieweeAndFilterByRating() {
    Page<ReviewSummaryDto> given = service.given(candidate.getId(), 0, 12);
    assertThat(given.getContent()).singleElement().satisfies(card -> {
      assertThat(card.person().name()).isEqualTo("Ivan Viewer");
      assertThat(card.excerpt()).isEqualTo("Great hints");
    });
    assertThat(service.received(candidate.getId(), 5, 0, 12).getContent()).isEmpty();
    assertThat(service.received(candidate.getId(), 4, 0, 12).getContent()).hasSize(1);
  }

  @Test
  void detailHasTheFullCommentAndLabelledScoresInRubricOrder() {
    ReviewDetailDto detail = service.detail(candidate.getId(), aboutCandidate.getId());

    assertThat(detail.comment()).startsWith("Clear communication.").doesNotContain("…");
    assertThat(detail.scores()).extracting(ReviewDetailDto.Score::label)
        .containsExactly("Communication", "Correctness", "legacy_metric");
    assertThat(detail.person().name()).isEqualTo("Ivan Viewer");

    // The reviewer can open what they wrote, too.
    assertThat(service.detail(interviewer.getId(), aboutCandidate.getId()).person().name()).isEqualTo("Candy Date");
  }

  @Test
  void nobodyElseCanOpenAReview() {
    assertThatThrownBy(() -> service.detail(stranger.getId(), aboutCandidate.getId()))
        .isInstanceOf(ApiException.class).extracting("code").isEqualTo("NOT_FOUND");
    assertThat(service.received(stranger.getId(), null, 0, 12).getContent()).isEmpty();
  }

  @Test
  void excerptsKeepShortCommentsAndCutLongOnesAtAWord() {
    assertThat(ReviewService.excerpt(null)).isNull();
    assertThat(ReviewService.excerpt("  Nice\n\n work ")).isEqualTo("Nice work");
    assertThat(ReviewService.excerpt("word ".repeat(100))).endsWith("word…");
  }

  private User user(String username, String name) {
    User user = new User();
    user.setName(name);
    user.setUsername(username);
    user.setEmail(username + "-" + UUID.randomUUID() + "@example.com");
    user.setPasswordHash("hash");
    user.setForgotPasswordCount(0);
    return db.persist(user);
  }

  private Feedback review(Interview interview, User reviewer, User reviewee, InterviewRole role, int rating,
      String comment, Map<String, Integer> scores) {
    Feedback feedback = new Feedback();
    feedback.setInterview(interview);
    feedback.setReviewer(reviewer);
    feedback.setReviewee(reviewee);
    feedback.setReviewerRole(role);
    feedback.setRating(rating);
    feedback.setComment(comment);
    feedback.setScores(scores);
    return db.persist(feedback);
  }
}
