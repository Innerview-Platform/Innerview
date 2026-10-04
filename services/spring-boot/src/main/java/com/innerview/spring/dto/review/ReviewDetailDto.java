package com.innerview.spring.dto.review;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import com.innerview.spring.enums.HireSignal;
import com.innerview.spring.enums.InterviewRole;
import java.time.LocalDateTime;
import java.util.List;

/** The full review, for the details pop-up. */
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record ReviewDetailDto(
    Long id,
    ReviewPerson person,
    InterviewRole reviewerRole,
    Integer rating,
    String comment,
    HireSignal hireSignal,
    List<Score> scores,
    ReviewInterview interview,
    LocalDateTime createdAt) {

  /** One rubric criterion with its 1–5 score. */
  @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
  public record Score(String id, String label, String description, int score) {}
}
