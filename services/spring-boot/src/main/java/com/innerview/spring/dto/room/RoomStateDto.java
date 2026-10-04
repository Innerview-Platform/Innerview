package com.innerview.spring.dto.room;

import com.innerview.spring.entity.RoomUiConfig;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** The live room as every participant sees it; also pushed on /topic/room/{code}/state. */
public record RoomStateDto(
    String code,
    String displayCode,
    Long interviewId,
    String title,
    String type,
    RoomUiConfig uiConfig,
    UUID ownerId,
    UUID hostId,
    String accessPolicy,
    Instant endsAt,
    boolean extended,
    int maxParticipants,
    List<ParticipantDto> participants) {}
