package com.innerview.spring.dto.room;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Interview summary page: what happened, with the saved code, notes, chat and participants. */
public record InterviewDetailsDto(
    Long id,
    String code,
    String displayCode,
    String title,
    String type,
    String status,
    Instant startTime,
    Instant endTime,
    Instant liveSince,
    Integer durationMinutes,
    UUID ownerId,
    String hostName,
    String accessPolicy,
    String myRole,
    boolean owner,
    boolean staff,
    List<Person> participants,
    String sharedCode,
    String problemNotes,
    /** Only for the host and interviewers. */
    String interviewerNotes,
    List<ChatMessageDto> chat,
    List<InviteDto> invites) {

  public record Person(UUID userId, String name, String role) {}
}
