package com.innerview.spring.enums;

/** The kind of notification carried by a {@link com.innerview.spring.entity.ScheduleNotification}. */
public enum NotificationType {
  WELCOME,
  INTERVIEW_SCHEDULED,
  INTERVIEW_REMINDER,
  /** Someone invited you to an interview. */
  INTERVIEW_INVITE,
  /** Someone is waiting in your interview's lobby. */
  JOIN_REQUEST
}
