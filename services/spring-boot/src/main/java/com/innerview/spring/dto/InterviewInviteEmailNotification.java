package com.innerview.spring.dto;

import com.innerview.spring.enums.InterviewType;
import com.innerview.spring.interfaces.EmailSendable;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

/**
 * Invitation email with the join link and an "Add to Google Calendar" link. Sent to people who
 * don't have an account yet too (they sign up with the invited email and are matched on join).
 */
public class InterviewInviteEmailNotification extends Notification implements EmailSendable {

  /** Recipient id for people without an account (email-only delivery). */
  public static final UUID NO_ACCOUNT = new UUID(0, 0);

  private static final DateTimeFormatter GCAL =
      DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'").withZone(ZoneOffset.UTC);

  protected final String inviterName;
  protected final String title;
  protected final InterviewType type;
  protected final String role;
  protected final Instant startTime;
  protected final Instant endTime;
  protected final String joinUrl;

  public InterviewInviteEmailNotification(
      UUID recipientId,
      String recipientEmail,
      String inviterName,
      String title,
      InterviewType type,
      String role,
      Instant startTime,
      Instant endTime,
      String joinUrl) {
    super((recipientId == null ? NO_ACCOUNT : recipientId).toString(), recipientEmail);
    this.inviterName = inviterName;
    this.title = title;
    this.type = type;
    this.role = role;
    this.startTime = startTime;
    this.endTime = endTime;
    this.joinUrl = joinUrl;
  }

  @Override
  public String getEmailSubject() {
    return inviterName + " invited you to a mock interview — InnerView";
  }

  @Override
  public String toEmailContent() {
    String calendarLink =
        "https://calendar.google.com/calendar/render?action=TEMPLATE&text="
            + encode(displayTitle())
            + "&dates="
            + GCAL.format(startTime)
            + "/"
            + GCAL.format(endTime)
            + "&details="
            + encode("Join: " + joinUrl);
    return NotificationEmailTemplate.render(
        "Invitation",
        "You're invited.",
        "<strong style=\"color:#e4d9ff; font-weight:600;\">"
            + NotificationEmailTemplate.escapeHtml(inviterName)
            + "</strong> invited you to join <strong>"
            + NotificationEmailTemplate.escapeHtml(displayTitle())
            + "</strong> as "
            + NotificationEmailTemplate.escapeHtml(roleLabel())
            + ". Use the button below to join — you won't have to wait in the lobby."
            + " <a href=\""
            + calendarLink
            + "\" style=\"color:#a855f7;\">Add to Google Calendar</a>.",
        List.of(
            new NotificationEmailTemplate.DetailRow("When", formatInstant(startTime)),
            new NotificationEmailTemplate.DetailRow("Type", type != null ? type.name() : "N/A"),
            new NotificationEmailTemplate.DetailRow("Your role", roleLabel()),
            new NotificationEmailTemplate.DetailRow("Link", joinUrl)),
        "Join the interview",
        joinUrl,
        "$ innerview --join<br>&gt; lobby skipped · you're on the guest list");
  }

  protected String displayTitle() {
    return title == null || title.isBlank() ? "a mock interview" : title;
  }

  protected String roleLabel() {
    return switch (role) {
      case "INTERVIEWER" -> "an interviewer";
      case "OBSERVER" -> "an observer";
      default -> "the candidate";
    };
  }

  private static String encode(String value) {
    return URLEncoder.encode(value, StandardCharsets.UTF_8);
  }
}
