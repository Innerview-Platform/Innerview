package com.innerview.spring.dto;

import com.innerview.spring.enums.InterviewType;
import com.innerview.spring.enums.ReminderInterval;
import com.innerview.spring.enums.RoomSize;
import com.innerview.spring.interfaces.EmailSendable;
import com.innerview.spring.interfaces.InAppSendable;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class InterviewReminderNotification extends Notification
    implements EmailSendable, InAppSendable {

  private final Instant scheduledAt;
  private final String sessionUrl;
  private final InterviewType interviewType;
  private final RoomSize roomSize;
  private final ReminderInterval interval;

  public InterviewReminderNotification(
      String recipientId,
      String recipientEmail,
      InterviewType interviewType,
      RoomSize roomSize,
      Instant scheduledAt,
      ReminderInterval reminderInterval,
      String sessionUrl) {
    super(recipientId, recipientEmail);
    this.scheduledAt = scheduledAt;
    this.sessionUrl = sessionUrl;
    this.interviewType = interviewType;
    this.roomSize = roomSize;
    this.interval = reminderInterval;
  }

  private String humanInterval() {
    return switch (interval) {
      case ONE_DAY -> "tomorrow";
      case ONE_HOUR -> "in 1 hour";
      case TEN_MINS -> "in 10 minutes";
    };
  }

  @Override
  public String getEmailSubject() {
    return "Reminder: your interview is " + humanInterval() + " — InnerView";
  }

  @Override
  public String toEmailContent() {
    return NotificationEmailTemplate.render(
        "Reminder",
        "Your interview is " + humanInterval() + ".",
        "This is a heads up that your mock interview is coming up "
            + humanInterval()
            + ". Make sure your camera and mic are ready before you join.",
        List.of(
            new NotificationEmailTemplate.DetailRow("When", formatInstant(scheduledAt)),
            new NotificationEmailTemplate.DetailRow(
                "Type", interviewType != null ? interviewType.name() : "N/A"),
            new NotificationEmailTemplate.DetailRow(
                "Format", roomSize == RoomSize.ONE_ON_ONE ? "1-on-1" : "Group")),
        "Join room",
        sessionUrl,
        "$ innerview --status reminder<br>&gt; "
            + interval.name().toLowerCase().replace('_', ' ')
            + " warning sent");
  }

  @Override
  public String toInAppContent() {
    Map<String, Object> content = new LinkedHashMap<>();
    content.put("type", "INTERVIEW_REMINDER");
    content.put("notificationId", getNotificationId());
    content.put("title", "Interview " + humanInterval());
    content.put(
        "message",
        "Your "
            + (interviewType != null ? interviewType.name() : "")
            + " interview starts "
            + humanInterval()
            + ".");
    content.put("sessionUrl", sessionUrl);
    content.put("scheduledAt", scheduledAt != null ? scheduledAt.toString() : null);
    content.put("interval", interval != null ? interval.name() : null);
    content.put("createdAt", getCreatedAt().toString());
    return toJson(content);
  }
}
