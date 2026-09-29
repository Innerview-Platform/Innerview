package com.innerview.spring.dto.feedback;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

public record FeedbackViewDto(
    Long id,
    UUID reviewerId,
    String reviewerName,
    UUID revieweeId,
    String revieweeName,
    String reviewerRole,
    Integer rating,
    String comment,
    Map<String, Integer> scores,
    String hireSignal,
    LocalDateTime createdAt) {}
