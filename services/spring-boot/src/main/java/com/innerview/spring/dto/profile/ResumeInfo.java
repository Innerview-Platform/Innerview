package com.innerview.spring.dto.profile;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import java.time.LocalDateTime;

/** The uploaded resume's details (never its bytes). */
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record ResumeInfo(String filename, String contentType, int size, LocalDateTime uploadedAt) {}
