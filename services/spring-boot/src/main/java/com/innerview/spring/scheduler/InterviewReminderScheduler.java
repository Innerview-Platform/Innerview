package com.innerview.spring.scheduler;

import com.innerview.spring.dto.InterviewReminderNotification;
import com.innerview.spring.entity.Interview;
import com.innerview.spring.enums.InterviewStatus;
import com.innerview.spring.enums.NotificationType;
import com.innerview.spring.enums.ReminderInterval;
import com.innerview.spring.enums.RoomSize;
import com.innerview.spring.repository.InterviewRepository;
import com.innerview.spring.service.NotificationPublisherService;
import com.innerview.spring.service.UserProfileService;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Polls for scheduled interviews entering a reminder window (ONE_DAY / ONE_HOUR / TEN_MINS before
 * start) and fires an {@link InterviewReminderNotification} for each. Polling — rather than
 * per-interview Redis TTL + keyspace-notification triggers — is used deliberately: Redis keyspace
 * notifications make no delivery guarantee (they can be silently dropped under memory pressure or
 * with replication), which is a bad trade for a user-facing reminder. A DB query every minute is
 * simple and reliable instead.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class InterviewReminderScheduler {

  private static final Duration POLL_INTERVAL = Duration.ofMinutes(1);

  /** How long a dedupe marker survives — must outlive the longest reminder lead time. */
  private static final Duration DEDUPE_TTL = Duration.ofHours(26);

  private final InterviewRepository interviewRepository;
  private final UserProfileService userProfileService;
  private final NotificationPublisherService notificationPublisherService;
  private final StringRedisTemplate stringRedisTemplate;

  @Value("${frontend.url}")
  private String frontendUrl;

  @Scheduled(fixedDelay = 60000)
  public void sendDueReminders() {
    Instant now = Instant.now();
    for (ReminderInterval interval : ReminderInterval.values()) {
      Instant windowStart = now.plus(leadTime(interval));
      Instant windowEnd = windowStart.plus(POLL_INTERVAL);

      List<Interview> due;
      try {
        due =
            interviewRepository.findByStatusAndStartTimeBetween(
                InterviewStatus.SCHEDULED, windowStart, windowEnd);
      } catch (Exception e) {
        log.error("Failed to query interviews due for {} reminder", interval, e);
        continue;
      }

      for (Interview interview : due) {
        sendReminderIfNotAlreadySent(interview, interval);
      }
    }
  }

  private void sendReminderIfNotAlreadySent(Interview interview, ReminderInterval interval) {
    String dedupeKey = "reminder:sent:" + interview.getId() + ":" + interval.name();
    Boolean firstTime;
    try {
      firstTime =
          stringRedisTemplate.opsForValue().setIfAbsent(dedupeKey, "1", DEDUPE_TTL);
    } catch (Exception e) {
      log.error(
          "Redis dedupe check failed for interviewId={} interval={} — skipping to avoid a "
              + "possible duplicate send",
          interview.getId(),
          interval,
          e);
      return;
    }

    if (!Boolean.TRUE.equals(firstTime)) {
      return; // already sent for this interview+interval
    }

    try {
      var ownerProfile = userProfileService.getUserProfile(interview.getOwnerId());
      String recipientEmail = ownerProfile.getUser().getEmail();
      RoomSize roomSize =
          interview.getRoomSize() != null && interview.getRoomSize() == 2
              ? RoomSize.ONE_ON_ONE
              : RoomSize.MANY;
      String sessionUrl = frontendUrl + "/room/join/" + interview.getRoomId();

      InterviewReminderNotification notification =
          new InterviewReminderNotification(
              interview.getOwnerId().toString(),
              recipientEmail,
              interview.getType(),
              roomSize,
              interview.getStartTime(),
              interval,
              sessionUrl);

      notificationPublisherService.dispatch(notification, NotificationType.INTERVIEW_REMINDER);
      log.info(
          "Queued {} reminder for interviewId={} recipient={}",
          interval,
          interview.getId(),
          interview.getOwnerId());
    } catch (Exception e) {
      log.error(
          "Failed to send {} reminder for interviewId={}", interval, interview.getId(), e);
    }
  }

  private Duration leadTime(ReminderInterval interval) {
    return switch (interval) {
      case ONE_DAY -> Duration.ofDays(1);
      case ONE_HOUR -> Duration.ofHours(1);
      case TEN_MINS -> Duration.ofMinutes(10);
    };
  }
}
