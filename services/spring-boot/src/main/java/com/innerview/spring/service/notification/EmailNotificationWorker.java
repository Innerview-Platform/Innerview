package com.innerview.spring.service.notification;

import com.innerview.spring.entity.ScheduleNotification;
import com.innerview.spring.entity.OutboxRecord;
import com.innerview.spring.enums.Channel;
import com.innerview.spring.enums.NotificationType;
import com.innerview.spring.enums.OutboxStatus;
import com.innerview.spring.repository.OutboxRepository;
import com.innerview.spring.service.GoogleApiService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.AllArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import software.amazon.awssdk.services.dynamodb.model.DynamoDbException;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.LinkedBlockingQueue;

@AllArgsConstructor
public class EmailNotificationWorker implements Runnable {

    private static final Logger log = LoggerFactory.getLogger(EmailNotificationWorker.class);
    private final OutboxRepository outboxRepository;
    private final GoogleApiService googleApiService;
    private final JavaMailSender mailSender;

    static final int  ATTEMPTS_THRESHOLD = 3;
    static final long BACKOFF_1ST_MS     = 30_000L;
    static final long BACKOFF_2ND_MS     = 120_000L;

    LinkedBlockingQueue<ScheduleNotification> emailQueue;

    @Override
    public void run() {
        log.info("EmailNotificationWorker started on thread {}", Thread.currentThread().getName());

        while (!Thread.currentThread().isInterrupted()) {
            ScheduleNotification event = null;
            try {
                event = emailQueue.take();
                processEvent(event);

                // Only interview-scheduling emails get a Google Calendar invite — a welcome email
                // or a reminder shouldn't create a second calendar event.
                if (event.getType() == NotificationType.INTERVIEW_SCHEDULED) {
                    try {
                        String meetLink = googleApiService.createInterviewEvent(event);
                        if (meetLink != null) {
                            log.info("Google Meet link created for eventId={}: {}", event.getEventId(), meetLink);
                        }
                    } catch (Exception e) {
                        log.warn("Google Calendar skipped for eventId={}: {}", event.getEventId(), e.getMessage());
                    }
                }

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.info("EmailNotificationWorker interrupted — shutting down");

            } catch (Exception e) {
                log.error("Unexpected error processing email event={} — continuing loop",
                        event != null ? event.getEventId() : "null", e);
            }
        }
    }

    // ── Process ───────────────────────────────────────────────────────────────

    private void processEvent(ScheduleNotification event) {
        if (event == null) {
            log.error("processing null event (error in the queue passing)");
            return;
        }

        if (!event.getChannel().name().equals(Channel.EMAIL.name())) {
            log.error("email worker cannot process this event");
            return;
        }

        long now = System.currentTimeMillis();
        OutboxRecord record = new OutboxRecord(event.getEventId(), event.getChannel().name(), now);

        boolean written = outboxRepository.putPending(record);
        if (!written) {
            log.error("Outbox write failed for eventId={} — skipping delivery", event.getEventId());
            return;
        }

        Optional<OutboxRecord> existing = outboxRepository.findByKey(event.getEventId(), event.getChannel().name());

        if (existing.isPresent()) {
            OutboxRecord stored = existing.get();
            if (stored.getSesMessageId() != null && stored.getStatus().name().equals(OutboxStatus.SENT.name())) {
                log.info("Email already sent (mockMessageId={}), skipping: eventId={}",
                        stored.getSesMessageId(), stored.getEventId());
                return;
            }
            record.setAttempts(stored.getAttempts());
        }

        boolean lockAcquired = false;
        try {
            lockAcquired = outboxRepository.acquireSendingLock(event.getEventId(), event.getChannel().name(), now);
        } catch (DynamoDbException e) {
            log.error("DynamoDB error acquiring SENDING lock for eventId={} — skipping", event.getEventId(), e);
            return;
        }

        if (!lockAcquired) {
            log.debug("SENDING lock not acquired for eventId={} — another thread owns it", event.getEventId());
            return;
        }

        attemptSmtpDelivery(event, record);
    }

    // ── Delivery ──────────────────────────────────────────────────────────────

    private void attemptSmtpDelivery(ScheduleNotification event, OutboxRecord record) {
        String eventId = event.getEventId();
        String channel = event.getChannel().name();

        Object rawHtml = event.getPayload() != null ? event.getPayload().get("html") : null;
        if (!(rawHtml instanceof String html)) {
            log.error("Missing rendered 'html' in payload for eventId={} — skipping delivery", eventId);
            return;
        }

        String toEmail = (String) event.getPayload().getOrDefault("toEmail", event.getRecipientEmail());
        String subject = (String) event.getPayload().getOrDefault("subject", "Notification — InnerView");

        try {
            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mime, true, "UTF-8");

            helper.setFrom("innerview@gmail.com");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(html, true); // true = isHtml

            mailSender.send(mime);

            String mockMessageId = "smtp-" + UUID.randomUUID();
            outboxRepository.markSent(eventId, channel, mockMessageId);
            log.info("Email delivered: eventId={} mockMessageId={}", eventId, mockMessageId);

        } catch (MessagingException | MailException e) {
            int newAttempts = record.getAttempts() + 1;

            if (newAttempts >= ATTEMPTS_THRESHOLD) {
                outboxRepository.markDead(eventId, channel);
                log.error("Email DEAD after {} attempts: eventId={} error={}",
                        ATTEMPTS_THRESHOLD, eventId, e.getMessage());
            } else {
                long additionTime = newAttempts == 1 ? BACKOFF_1ST_MS : BACKOFF_2ND_MS;
                long nextTime     = additionTime + System.currentTimeMillis();
                outboxRepository.markPendingForRetry(eventId, channel, newAttempts, nextTime);
                log.warn("Email delivery failed (attempt {}/{}): eventId={} nextRetry=+{}s error={}",
                        newAttempts, ATTEMPTS_THRESHOLD, eventId, additionTime / 1000, e.getMessage());
            }
        }
    }
}
