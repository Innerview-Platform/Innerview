package com.innerview.spring.dto.profile;

/** GET /api/auth/username-available — {@code reason} explains why it is unavailable. */
public record UsernameAvailabilityResponse(String username, boolean available, String reason) {}
