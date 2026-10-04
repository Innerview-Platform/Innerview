package com.innerview.spring.dto;

import com.innerview.spring.enums.NotificationType;
import java.time.Instant;

/**
 * A notification to send once the current transaction commits, so a rolled-back request never
 * emails anyone. The interview fields are only used for INTERVIEW_SCHEDULED (calendar event).
 */
public record NotificationRequestedEvent(
    Notification notification,
    NotificationType type,
    Long interviewId,
    Instant date,
    Instant endTime,
    Integer durationMinutes,
    String ownerUsername,
    String ownerAccount) {

  public NotificationRequestedEvent(Notification notification, NotificationType type) {
    this(notification, type, null, null, null, null, null, null);
  }
}
