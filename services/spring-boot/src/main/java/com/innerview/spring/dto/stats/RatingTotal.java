package com.innerview.spring.dto.stats;

import java.util.UUID;

public record RatingTotal(UUID userId, Long ratingSum, Long ratingCount) {}
