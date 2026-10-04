package com.innerview.spring.scheduler;

import com.innerview.spring.core.util.RoomUtil;
import com.innerview.spring.entity.Interview;
import com.innerview.spring.enums.InterviewEndReason;
import com.innerview.spring.enums.InterviewStatus;
import com.innerview.spring.repository.InterviewRepository;
import com.innerview.spring.service.RoomService;
import java.time.Duration;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Drives interview lifecycles from the database (the source of truth, so it survives restarts):
 * live-room housekeeping every few seconds, and a sweep for interviews that ran out of time while
 * no room was open (e.g. after a restart) or that nobody ever joined.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class InterviewLifecycleScheduler {

  /** An interview nobody joined is marked as a no-show this long after its start time. */
  static final Duration NO_SHOW_AFTER = Duration.ofMinutes(30);

  private final RoomService roomService;
  private final InterviewRepository interviewRepository;

  /** Reconnect grace, host hand-off, time warnings, time-up, empty rooms, lobby expiry. */
  @Scheduled(fixedDelay = 5_000)
  public void tickRooms() {
    try {
      roomService.tick();
    } catch (Exception e) {
      log.error("[Lifecycle] Room tick failed", e);
    }
  }

  @Scheduled(fixedDelay = 60_000, initialDelay = 30_000)
  public void sweep() {
    Instant now = Instant.now();
    try {
      for (Interview interview : interviewRepository.findByStatusAndEndTimeBefore(InterviewStatus.STARTED, now)) {
        if (!roomService.isLive(RoomUtil.canonical(interview.getRoomId()))) {
          roomService.endInterview(interview, InterviewEndReason.TIME_UP);
        }
      }
      for (Interview interview : interviewRepository.findByStatusAndStartTimeBefore(InterviewStatus.SCHEDULED, now.minus(NO_SHOW_AFTER))) {
        if (interview.getLiveSince() == null && !roomService.isLive(RoomUtil.canonical(interview.getRoomId()))) {
          roomService.endInterview(interview, InterviewEndReason.NO_SHOW);
        }
      }
    } catch (Exception e) {
      log.error("[Lifecycle] Sweep failed", e);
    }
  }
}
