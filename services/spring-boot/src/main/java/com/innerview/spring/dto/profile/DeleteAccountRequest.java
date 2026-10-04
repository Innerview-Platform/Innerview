package com.innerview.spring.dto.profile;

import jakarta.validation.constraints.NotBlank;

/**
 * POST /api/profile/me/delete-account. {@code confirmation} must be the user's username (or email when
 * they have none); {@code password} is required for accounts that have one (not Google-only accounts).
 */
public record DeleteAccountRequest(@NotBlank(message = "Type your username to confirm") String confirmation, String password) {}
