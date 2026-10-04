package com.innerview.spring.dto;

import com.innerview.spring.enums.InterviewType;
import com.innerview.spring.interfaces.InAppSendable;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/** Cancellation for someone who has an account: email plus an in-app notification. */
public class InterviewCancelledNotification extends InterviewCancelledEmailNotification implements InAppSendable {

  public InterviewCancelledNotification(
      UUID recipientId, String recipientEmail, String title, InterviewType type, Instant startTime) {
    super(recipientId, recipientEmail, title, type, startTime);
  }

  @Override
  public String toInAppContent() {
    Map<String, Object> content = new LinkedHashMap<>();
    content.put("type", "INTERVIEW_CANCELLED");
    content.put("notificationId", getNotificationId());
    content.put("title", "Interview cancelled");
    content.put("message", displayTitle() + " was cancelled.");
    content.put("scheduledAt", startTime != null ? startTime.toString() : null);
    content.put("createdAt", getCreatedAt().toString());
    return toJson(content);
  }
}
