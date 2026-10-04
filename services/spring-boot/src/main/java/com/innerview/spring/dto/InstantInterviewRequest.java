package com.innerview.spring.dto;

import com.innerview.spring.enums.InterviewRole;
import com.innerview.spring.enums.InterviewType;
import com.innerview.spring.enums.RoomSize;
import java.util.List;
import java.util.UUID;
import lombok.Data;
import org.jetbrains.annotations.NotNull;

@Data
public class InstantInterviewRequest {
  InterviewType interviewType;
  @NotNull RoomSize roomSize;
  @NotNull InterviewRole creatorInterviewRole;
  Integer durationMinutes;
  List<UUID> problemIds;
  /** Optional name for the interview. */
  String title;
  /** Who may enter without being let in (default ASK_TO_JOIN). */
  com.innerview.spring.enums.AccessPolicy accessPolicy;
  /** People to invite by email. */
  java.util.List<com.innerview.spring.dto.room.InviteRequest.Invitee> invitees;
}
