package com.innerview.spring.dto;

import com.innerview.spring.enums.InterviewType;
import com.innerview.spring.interfaces.EmailSendable;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Tells an invitee that an interview was cancelled. Email only, for people without an account; the
 * wording is neutral because the host may have cancelled it or closed their account.
 */
public class InterviewCancelledEmailNotification extends Notification implements EmailSendable {

  protected final String title;
  protected final InterviewType type;
  protected final Instant startTime;

  public InterviewCancelledEmailNotification(
      UUID recipientId, String recipientEmail, String title, InterviewType type, Instant startTime) {
    super((recipientId == null ? InterviewInviteEmailNotification.NO_ACCOUNT : recipientId).toString(), recipientEmail);
    this.title = title;
    this.type = type;
    this.startTime = startTime;
  }

  @Override
  public String getEmailSubject() {
    return "Cancelled: " + displayTitle() + " — InnerView";
  }

  @Override
  public String toEmailContent() {
    return NotificationEmailTemplate.render(
        "Cancelled",
        "This interview was cancelled.",
        "<strong>"
            + NotificationEmailTemplate.escapeHtml(displayTitle())
            + "</strong> won't take place, and its link no longer works."
            + " If you added it to your calendar, you can remove it.",
        List.of(
            new NotificationEmailTemplate.DetailRow("Was scheduled for", formatInstant(startTime)),
            new NotificationEmailTemplate.DetailRow("Type", type != null ? type.name() : "N/A")),
        null,
        null,
        "$ innerview --status<br>&gt; interview cancelled");
  }

  protected String displayTitle() {
    return title == null || title.isBlank() ? "Your mock interview" : title;
  }
}
