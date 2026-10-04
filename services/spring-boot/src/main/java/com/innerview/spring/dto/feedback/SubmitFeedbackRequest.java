package com.innerview.spring.dto.feedback;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.Map;
import java.util.UUID;

public record SubmitFeedbackRequest(
    @NotNull UUID revieweeId,
    @NotNull @Min(1) @Max(5) Integer rating,
    @Size(max = 4000) String comment,
    Map<String, Integer> scores,
    String hireSignal) {}
