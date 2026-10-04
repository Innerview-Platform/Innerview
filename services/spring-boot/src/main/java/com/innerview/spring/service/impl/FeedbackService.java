package com.innerview.spring.service.impl;

import com.innerview.spring.dto.feedback.FeedbackFormDto;
import com.innerview.spring.dto.feedback.FeedbackRubric;
import com.innerview.spring.dto.feedback.FeedbackViewDto;
import com.innerview.spring.dto.feedback.SubmitFeedbackRequest;
import com.innerview.spring.entity.Feedback;
import com.innerview.spring.entity.Interview;
import com.innerview.spring.entity.UserInterview;
import com.innerview.spring.entity.UserInterviewId;
import com.innerview.spring.enums.HireSignal;
import com.innerview.spring.enums.InterviewRole;
import com.innerview.spring.enums.InterviewStatus;
import com.innerview.spring.exception.ApiException;
import com.innerview.spring.repository.FeedbackRepository;
import com.innerview.spring.repository.InterviewRepository;
import com.innerview.spring.repository.UserInterviewRepository;
import com.innerview.spring.repository.UserRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Post-interview scorecards. Interviewers and observers review the candidate (per-type rubric plus a
 * hire signal); the candidate reviews the interviewer(s). One review per reviewer, reviewee and interview.
 */
@Service
@RequiredArgsConstructor
public class FeedbackService {

  private final FeedbackRepository feedbackRepository;
  private final InterviewRepository interviewRepository;
  private final UserInterviewRepository userInterviewRepository;
  private final UserRepository userRepository;

  @Transactional(readOnly = true)
  public FeedbackFormDto getForm(Long interviewId, UUID userId) {
    Interview interview = interview(interviewId);
    UserInterview me = participation(interviewId, userId);
    List<UserInterview> everyone = userInterviewRepository.findByIdInterviewId(interviewId);
    List<Feedback> all = feedbackRepository.findByInterviewId(interviewId);

    List<FeedbackFormDto.Reviewee> reviewees = everyone.stream()
        .filter(other -> canReview(me.getRole(), other.getRole()) && !other.getId().getUserId().equals(userId))
        .map(other -> {
          UUID revieweeId = other.getId().getUserId();
          FeedbackViewDto submitted = all.stream()
              .filter(f -> f.getReviewer().getId().equals(userId) && f.getReviewee().getId().equals(revieweeId))
              .findFirst().map(FeedbackService::view).orElse(null);
          boolean reviewingCandidate = other.getRole() == InterviewRole.INTERVIEWEE;
          return new FeedbackFormDto.Reviewee(
              revieweeId,
              other.getUser().getName(),
              other.getRole().name(),
              reviewingCandidate ? FeedbackRubric.forCandidate(interview.getType()) : FeedbackRubric.FOR_INTERVIEWER,
              reviewingCandidate && me.getRole() == InterviewRole.INTERVIEWER,
              submitted);
        })
        .toList();

    List<FeedbackViewDto> received = all.stream()
        .filter(f -> f.getReviewee().getId().equals(userId))
        .map(FeedbackService::view)
        .toList();

    return new FeedbackFormDto(
        interviewId,
        interview.getType() == null ? null : interview.getType().name(),
        interview.getStatus().name(),
        me.getRole().name(),
        reviewees,
        received);
  }

  @Transactional
  public FeedbackViewDto submit(Long interviewId, UUID reviewerId, SubmitFeedbackRequest request) {
    Interview interview = interview(interviewId);
    if (interview.getStatus() != InterviewStatus.COMPLETED) {
      throw ApiException.conflict("NOT_ENDED", "Feedback opens once the interview has ended");
    }
    UserInterview reviewer = participation(interviewId, reviewerId);
    if (request.revieweeId().equals(reviewerId)) throw ApiException.badRequest("SELF_REVIEW", "You can't review yourself");
    UserInterview reviewee = userInterviewRepository.findById(new UserInterviewId(request.revieweeId(), interviewId))
        .orElseThrow(() -> ApiException.badRequest("NOT_A_PARTICIPANT", "That person didn't take part in this interview"));
    if (!canReview(reviewer.getRole(), reviewee.getRole())) {
      throw ApiException.forbidden("CANNOT_REVIEW", "You can't review this participant");
    }
    if (feedbackRepository.existsByInterviewIdAndReviewerIdAndRevieweeId(interviewId, reviewerId, request.revieweeId())) {
      throw ApiException.conflict("ALREADY_REVIEWED", "You already reviewed this participant");
    }

    boolean reviewingCandidate = reviewee.getRole() == InterviewRole.INTERVIEWEE;
    Set<String> allowed = (reviewingCandidate ? FeedbackRubric.forCandidate(interview.getType()) : FeedbackRubric.FOR_INTERVIEWER)
        .stream().map(FeedbackRubric.Criterion::id).collect(Collectors.toSet());
    Map<String, Integer> scores = new HashMap<>();
    if (request.scores() != null) {
      request.scores().forEach((criterion, score) -> {
        if (!allowed.contains(criterion)) throw ApiException.badRequest("INVALID_CRITERION", "Unknown criterion: " + criterion);
        if (score == null || score < 1 || score > 5) throw ApiException.badRequest("INVALID_SCORE", "Scores go from 1 to 5");
        scores.put(criterion, score);
      });
    }
    HireSignal hireSignal = null;
    if (request.hireSignal() != null && !request.hireSignal().isBlank()) {
      if (!reviewingCandidate || reviewer.getRole() != InterviewRole.INTERVIEWER) {
        throw ApiException.badRequest("HIRE_SIGNAL_NOT_ALLOWED", "Only interviewers give a hire signal for the candidate");
      }
      try {
        hireSignal = HireSignal.valueOf(request.hireSignal().trim().toUpperCase(Locale.ROOT));
      } catch (IllegalArgumentException e) {
        throw ApiException.badRequest("INVALID_HIRE_SIGNAL", "Unknown hire signal");
      }
    }

    Feedback feedback = new Feedback();
    feedback.setInterview(interview);
    feedback.setReviewer(userRepository.getReferenceById(reviewerId));
    feedback.setReviewee(userRepository.getReferenceById(request.revieweeId()));
    feedback.setReviewerRole(reviewer.getRole());
    feedback.setRating(request.rating());
    feedback.setComment(request.comment() == null ? null : request.comment().strip());
    feedback.setScores(scores);
    feedback.setHireSignal(hireSignal);
    return view(feedbackRepository.save(feedback));
  }

  /** Interviewers and observers review candidates; candidates review interviewers. */
  static boolean canReview(InterviewRole reviewer, InterviewRole reviewee) {
    if (reviewer == InterviewRole.INTERVIEWEE) return reviewee == InterviewRole.INTERVIEWER;
    if (reviewer == InterviewRole.INTERVIEWER || reviewer == InterviewRole.OBSERVER) return reviewee == InterviewRole.INTERVIEWEE;
    return false;
  }

  private UserInterview participation(Long interviewId, UUID userId) {
    return userInterviewRepository.findById(new UserInterviewId(userId, interviewId))
        .orElseThrow(() -> ApiException.forbidden("NOT_A_PARTICIPANT", "You didn't take part in this interview"));
  }

  private Interview interview(Long id) {
    return interviewRepository.findById(id).orElseThrow(() -> ApiException.notFound("Interview not found"));
  }

  static FeedbackViewDto view(Feedback f) {
    return new FeedbackViewDto(
        f.getId(),
        f.getReviewer().getId(),
        f.getReviewer().getName(),
        f.getReviewee().getId(),
        f.getReviewee().getName(),
        f.getReviewerRole() == null ? null : f.getReviewerRole().name(),
        f.getRating(),
        f.getComment(),
        f.getScores(),
        f.getHireSignal() == null ? null : f.getHireSignal().name(),
        f.getCreatedAt());
  }
}
