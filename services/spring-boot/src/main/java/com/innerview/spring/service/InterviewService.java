package com.innerview.spring.service;

import com.innerview.spring.dto.InstantInterviewRequest;
import com.innerview.spring.dto.InterviewResponse;
import com.innerview.spring.dto.InterviewSummaryDto;
import com.innerview.spring.dto.ScheduledInterviewRequest;
import com.innerview.spring.dto.room.InterviewDetailsDto;
import com.innerview.spring.dto.room.UpcomingInterviewDto;
import java.util.List;
import java.util.UUID;

public interface InterviewService {

  InterviewResponse createInstantInterview(InstantInterviewRequest request, UUID currentUserId);

  InterviewResponse createScheduledInterview(ScheduledInterviewRequest request, UUID currentUserId);

  List<InterviewSummaryDto> getCreatedInterview(UUID userId);

  void cancelInterview(Long interviewId, UUID currentUserId);

  /** Ends a live interview (owner); same as ending it from the room. */
  void completeInterview(Long interviewId, UUID currentUserId);

  /** Interviews the user hosts, was invited to or is in, that haven't ended. */
  List<UpcomingInterviewDto> getUpcoming(UUID userId);

  /** Summary of an interview for its participants (and invitees before it happens). */
  InterviewDetailsDto getDetails(Long interviewId, UUID userId);

  /** iCalendar file for the interview. */
  String calendarFile(Long interviewId, UUID userId);
}
