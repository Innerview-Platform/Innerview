package com.innerview.spring.dto.room;

import java.time.Instant;
import java.util.UUID;

public record InviteDto(Long id, String email, String role, String status, UUID userId, Instant createdAt) {}
