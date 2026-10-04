package com.innerview.spring.dto;

import com.innerview.spring.dto.room.InviteRequest.Invitee;
import com.innerview.spring.enums.AccessPolicy;
import com.innerview.spring.enums.InterviewRole;
import com.innerview.spring.enums.InterviewType;
import com.innerview.spring.enums.RoomSize;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class ScheduledInterviewRequest {
  InterviewType interviewType;
  @NotNull(message = "Choose a room size") RoomSize roomSize;
  @NotNull(message = "Choose your role") InterviewRole creatorInterviewRole;
  @NotNull(message = "Choose a start time") Instant startTime;
  List<UUID> problemIds;
  @Size(max = 120, message = "Keep the title under 120 characters") String title;
  AccessPolicy accessPolicy;
  @Size(max = 20, message = "You can invite at most 20 people at once") List<@Valid Invitee> invitees;
}
