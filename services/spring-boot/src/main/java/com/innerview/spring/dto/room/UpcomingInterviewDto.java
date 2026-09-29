package com.innerview.spring.dto.room;

import java.time.Instant;

/** An interview the user hosts or is invited to that hasn't ended yet. */
public record UpcomingInterviewDto(
    Long id,
    String code,
    String displayCode,
    String title,
    String type,
    String status,
    Instant startTime,
    Instant endTime,
    String role,
    boolean owner,
    String hostName,
    boolean live) {}
