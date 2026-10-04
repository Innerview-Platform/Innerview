package com.innerview.spring.dto.feedback;

import java.util.List;
import java.util.UUID;

/** Who the user can review for an interview, with the criteria for each, and what they received. */
public record FeedbackFormDto(
    Long interviewId, String interviewType, String status, String myRole, List<Reviewee> reviewees, List<FeedbackViewDto> received) {

  public record Reviewee(
      UUID userId, String name, String username, String role, List<FeedbackRubric.Criterion> criteria, boolean hireSignal, FeedbackViewDto submitted) {}
}
