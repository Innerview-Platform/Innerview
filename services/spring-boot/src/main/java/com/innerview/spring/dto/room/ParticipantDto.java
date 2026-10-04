package com.innerview.spring.dto.room;

import java.time.Instant;
import java.util.UUID;

public record ParticipantDto(
    UUID userId, String name, String username, String avatarThumbUrl, String role, String status, boolean host, boolean owner, Instant joinedAt) {}
