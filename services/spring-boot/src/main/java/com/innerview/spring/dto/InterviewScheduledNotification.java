package com.innerview.spring.dto;

import com.innerview.spring.enums.InterviewType;
import com.innerview.spring.enums.RoomSize;
import com.innerview.spring.interfaces.EmailSendable;
import com.innerview.spring.interfaces.InAppSendable;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class InterviewScheduledNotification extends Notification
    implements EmailSendable, InAppSendable {

  private final String ownerName;
  private final Instant scheduledAt;
  private final String sessionUrl;
  private final InterviewType interviewType;
  private final RoomSize roomSize;
  private final Integer durationMinutes;

  public InterviewScheduledNotification(
      String recipientId,
      String recipientEmail,
      String ownerName,
      InterviewType interviewType,
      RoomSize roomSize,
      Instant scheduledAt,
      Integer durationMinutes,
      String sessionUrl) {
    super(recipientId, recipientEmail);
    this.ownerName = ownerName;
    this.scheduledAt = scheduledAt;
    this.sessionUrl = sessionUrl;
    this.interviewType = interviewType;
    this.roomSize = roomSize;
    this.durationMinutes = durationMinutes;
  }

  @Override
  public String getEmailSubject() {
    return "Interview scheduled — InnerView";
  }

  @Override
  public String toEmailContent() {
    return NotificationEmailTemplate.render(
        "Confirmed",
        "Interview scheduled.",
        "Your mock interview with <strong style=\"color:#e4d9ff; font-weight:600;\">"
            + NotificationEmailTemplate.escapeHtml(ownerName)
            + "</strong> is locked in. Add it to your calendar and show up sharp.",
        List.of(
            new NotificationEmailTemplate.DetailRow("When", formatInstant(scheduledAt)),
            new NotificationEmailTemplate.DetailRow(
                "Type", interviewType != null ? interviewType.name() : "N/A"),
            new NotificationEmailTemplate.DetailRow(
                "Format", roomSize == RoomSize.ONE_ON_ONE ? "1-on-1" : "Group"),
            new NotificationEmailTemplate.DetailRow(
                "Duration", (durationMinutes != null ? durationMinutes : 60) + " minutes")),
        "Open your room",
        sessionUrl,
        "$ innerview --status scheduled<br>&gt; room ready · editor synced · runtime warm");
  }

  @Override
  public String toInAppContent() {
    Map<String, Object> content = new LinkedHashMap<>();
    content.put("type", "INTERVIEW_SCHEDULED");
    content.put("notificationId", getNotificationId());
    content.put("title", "Interview scheduled");
    content.put(
        "message",
        "Your "
            + (interviewType != null ? interviewType.name() : "")
            + " interview is scheduled for "
            + formatInstant(scheduledAt)
            + ".");
    content.put("sessionUrl", sessionUrl);
    content.put("scheduledAt", scheduledAt != null ? scheduledAt.toString() : null);
    content.put("interviewType", interviewType != null ? interviewType.name() : null);
    content.put("roomSize", roomSize != null ? roomSize.name() : null);
    content.put("createdAt", getCreatedAt().toString());
    return toJson(content);
  }
}
