package com.innerview.spring.dto.review;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import com.innerview.spring.enums.HireSignal;
import com.innerview.spring.enums.InterviewRole;
import java.time.LocalDateTime;

/** A review card: who, how many stars, and the start of the comment. */
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record ReviewSummaryDto(
    Long id,
    ReviewPerson person,
    InterviewRole reviewerRole,
    Integer rating,
    String excerpt,
    HireSignal hireSignal,
    ReviewInterview interview,
    LocalDateTime createdAt) {}
