package com.innerview.spring.dto;

import com.innerview.spring.enums.InterviewType;
import com.innerview.spring.interfaces.InAppSendable;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/** Invitation for someone who already has an account: email plus an in-app notification. */
public class InterviewInviteNotification extends InterviewInviteEmailNotification implements InAppSendable {

  public InterviewInviteNotification(
      UUID recipientId,
      String recipientEmail,
      String inviterName,
      String title,
      InterviewType type,
      String role,
      Instant startTime,
      Instant endTime,
      String joinUrl) {
    super(recipientId, recipientEmail, inviterName, title, type, role, startTime, endTime, joinUrl);
  }

  @Override
  public String toInAppContent() {
    Map<String, Object> content = new LinkedHashMap<>();
    content.put("type", "INTERVIEW_INVITE");
    content.put("notificationId", getNotificationId());
    content.put("title", "Interview invitation");
    content.put("message", inviterName + " invited you to " + displayTitle() + " as " + roleLabel() + ".");
    content.put("sessionUrl", joinUrl);
    content.put("scheduledAt", startTime != null ? startTime.toString() : null);
    content.put("createdAt", getCreatedAt().toString());
    return toJson(content);
  }
}
