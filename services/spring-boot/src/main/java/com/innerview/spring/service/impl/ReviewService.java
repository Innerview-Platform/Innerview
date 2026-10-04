package com.innerview.spring.service.impl;

import com.innerview.spring.dto.feedback.FeedbackRubric;
import com.innerview.spring.dto.review.ReviewDetailDto;
import com.innerview.spring.dto.review.ReviewInterview;
import com.innerview.spring.dto.review.ReviewPerson;
import com.innerview.spring.dto.review.ReviewRow;
import com.innerview.spring.dto.review.ReviewSummaryDto;
import com.innerview.spring.entity.Feedback;
import com.innerview.spring.exception.ApiException;
import com.innerview.spring.repository.FeedbackRepository;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The private "reviews" section of a profile: reviews about the user and reviews they wrote. Only
 * ever queried for the signed-in user, so nobody can list someone else's reviews.
 */
@Service
@RequiredArgsConstructor
public class ReviewService {
  static final int EXCERPT_LENGTH = 160;
  private static final int MAX_PAGE_SIZE = 50;

  private final FeedbackRepository feedbackRepository;

  @Transactional(readOnly = true)
  public Page<ReviewSummaryDto> received(UUID userId, Integer rating, int page, int size) {
    if (rating != null && (rating < 1 || rating > 5)) throw ApiException.badRequest("INVALID_RATING", "Rating must be 1–5.");
    return feedbackRepository.findReviewsReceived(userId, rating, pageRequest(page, size)).map(ReviewService::summary);
  }

  @Transactional(readOnly = true)
  public Page<ReviewSummaryDto> given(UUID userId, int page, int size) {
    return feedbackRepository.findReviewsGiven(userId, pageRequest(page, size)).map(ReviewService::summary);
  }

  /** A review about the user, or one they wrote; anything else looks like it doesn't exist. */
  @Transactional(readOnly = true)
  public ReviewDetailDto detail(UUID userId, Long reviewId) {
    ReviewRow row = feedbackRepository.findReviewReceived(reviewId, userId)
        .or(() -> feedbackRepository.findReviewGiven(reviewId, userId))
        .orElseThrow(() -> ApiException.notFound("Review not found"));
    Feedback feedback = feedbackRepository.findById(reviewId).orElseThrow(() -> ApiException.notFound("Review not found"));
    return new ReviewDetailDto(
        row.id(), person(row), row.reviewerRole(), row.rating(), row.comment(), row.hireSignal(),
        scores(feedback), interview(row), row.createdAt());
  }

  private static PageRequest pageRequest(int page, int size) {
    return PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE));
  }

  private static ReviewSummaryDto summary(ReviewRow row) {
    return new ReviewSummaryDto(
        row.id(), person(row), row.reviewerRole(), row.rating(), excerpt(row.comment()), row.hireSignal(),
        interview(row), row.createdAt());
  }

  static String excerpt(String comment) {
    if (comment == null || comment.isBlank()) return null;
    String flat = comment.strip().replaceAll("\\s+", " ");
    if (flat.length() <= EXCERPT_LENGTH) return flat;
    int cut = flat.lastIndexOf(' ', EXCERPT_LENGTH);
    return flat.substring(0, cut > EXCERPT_LENGTH / 2 ? cut : EXCERPT_LENGTH).stripTrailing() + "…";
  }

  private static ReviewPerson person(ReviewRow row) {
    String thumb = row.personAvatarThumbFileId() != null
        ? ProfileFileService.AVATAR_PATH + row.personAvatarThumbFileId()
        : row.personAvatarFileId() != null ? ProfileFileService.AVATAR_PATH + row.personAvatarFileId() : row.personImageUrl();
    return new ReviewPerson(row.personId(), row.personUsername(), row.personName(), thumb);
  }

  private static ReviewInterview interview(ReviewRow row) {
    return new ReviewInterview(row.interviewId(), row.interviewTitle(), row.interviewType(), row.interviewStartTime());
  }

  /** Rubric scores in rubric order, labelled; unknown criteria (old rubrics) keep their id as label. */
  private static List<ReviewDetailDto.Score> scores(Feedback feedback) {
    if (feedback.getScores() == null || feedback.getScores().isEmpty()) return List.of();
    Map<String, FeedbackRubric.Criterion> criteria = new LinkedHashMap<>();
    Stream.concat(FeedbackRubric.forCandidate(feedback.getInterview().getType()).stream(), FeedbackRubric.FOR_INTERVIEWER.stream())
        .forEach(criterion -> criteria.putIfAbsent(criterion.id(), criterion));
    List<String> order = List.copyOf(criteria.keySet());
    return feedback.getScores().entrySet().stream()
        .sorted(Comparator.comparingInt(entry -> {
          int index = order.indexOf(entry.getKey());
          return index < 0 ? Integer.MAX_VALUE : index;
        }))
        .map(entry -> {
          FeedbackRubric.Criterion criterion = criteria.get(entry.getKey());
          return new ReviewDetailDto.Score(
              entry.getKey(),
              criterion != null ? criterion.label() : entry.getKey(),
              criterion != null ? criterion.description() : null,
              entry.getValue());
        })
        .toList();
  }
}
