package com.innerview.spring.service;

import com.innerview.spring.dto.Notification;
import com.innerview.spring.entity.ScheduleNotification;
import com.innerview.spring.enums.NotificationType;
import java.time.Instant;

public interface NotificationPublisherService {

  /** Routes a fully-built transport event straight into the send pipeline. */
  void publishEvent(ScheduleNotification event);

  /**
   * Renders {@code notification} via whichever of {@code EmailSendable}/{@code InAppSendable} it
   * implements and publishes one {@link ScheduleNotification} per supported channel.
   */
  void dispatch(Notification notification, NotificationType type);

  /**
   * Same as {@link #dispatch(Notification, NotificationType)}, plus the interview-specific fields
   * needed for Google Calendar event creation on the email channel (only used when {@code type} is
   * {@code INTERVIEW_SCHEDULED}).
   */
  void dispatch(
      Notification notification,
      NotificationType type,
      Long interviewId,
      Instant date,
      Instant endTime,
      Integer durationMinutes,
      String ownerUsername,
      String ownerAccount);
}
