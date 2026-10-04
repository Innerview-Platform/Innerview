package com.innerview.spring.dto.review;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import com.innerview.spring.enums.InterviewType;
import java.time.Instant;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record ReviewInterview(Long id, String title, InterviewType type, Instant startTime) {}
