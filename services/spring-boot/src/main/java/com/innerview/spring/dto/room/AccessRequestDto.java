package com.innerview.spring.dto.room;

import java.time.Instant;
import java.util.UUID;

public record AccessRequestDto(String id, UUID userId, String name, String email, Instant requestedAt, String status) {}
