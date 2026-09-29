package com.innerview.spring.dto.room;

import java.time.Instant;
import java.util.List;

/**
 * What the pre-join screen needs: the interview, and what this user can do.
 *
 * <p>{@code access}: HOST, INVITED, ADMITTED, OPEN (can join directly) · MUST_ASK · PENDING (asked,
 * waiting) · NOT_INVITED · DENIED · REMOVED · FULL · NOT_STARTED · ENDED · CANCELLED.
 */
public record AccessInfoDto(
    String code,
    String displayCode,
    Long interviewId,
    String title,
    String type,
    String hostName,
    Instant startTime,
    Instant endTime,
    String accessPolicy,
    String access,
    boolean canJoin,
    String role,
    List<String> participantsInside,
    Instant joinOpensAt,
    String requestId,
    boolean alreadyConnected) {}
