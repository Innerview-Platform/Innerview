package com.innerview.spring.dto.review;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import java.util.UUID;

/** The other person on a review: the reviewer (received reviews) or the reviewee (given reviews). */
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record ReviewPerson(UUID userId, String username, String name, String avatarThumbUrl) {}
