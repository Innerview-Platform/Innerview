package com.innerview.spring.service.impl;

import com.innerview.spring.dto.Notification;
import com.innerview.spring.entity.ScheduleNotification;
import com.innerview.spring.enums.Channel;
import com.innerview.spring.enums.NotificationType;
import com.innerview.spring.interfaces.EmailSendable;
import com.innerview.spring.interfaces.InAppSendable;
import com.innerview.spring.service.NotificationPublisherService;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.LinkedBlockingQueue;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

/**
 * this is the service responsible for the routing to the queues it is non blocking drop the message
 * in the queue based on the type of it if there is no size in queues we drop message in dynamodb
 */
@Service
public class NotificationService implements NotificationPublisherService {
  private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

  private final LinkedBlockingQueue<ScheduleNotification> inAppQueue;
  private final LinkedBlockingQueue<ScheduleNotification> emailQueue;

  public NotificationService(
      @Qualifier("inAppQueue") LinkedBlockingQueue<ScheduleNotification> inAppQueue,
      @Qualifier("emailQueue") LinkedBlockingQueue<ScheduleNotification> emailQueue) {
    this.inAppQueue = inAppQueue;
    this.emailQueue = emailQueue;
  }

  /**
   * Routes the event using offer() (NON-BLOCKING). * If the queue is under 500 capacity, it enters
   * RAM instantly (0.1ms). If the queue is full, offer() returns false. We simply drop the memory
   * handoff, knowing the DynamoDB Poller will safely pick it up later.
   */
  @Override
  public void publishEvent(ScheduleNotification event) {
    if (event == null) {
      log.warn("publishEvent() called with null event — ignoring");
      return;
    }

    switch (event.getChannel()) {
      case IN_APP -> {
        boolean accepted = inAppQueue.offer(event);
        if (accepted) {
          log.debug("Routed event {} to inAppQueue", event.getEventId());
        } else {
          log.warn(
              "inAppQueue full! Event {} dropped from RAM. Deferring to DynamoDB Poller.",
              event.getEventId());
          // logic here inshallah dropping message in disk db and the schedulled sweeper will send
          // them
        }
      }
      case EMAIL -> {
        boolean accepted = emailQueue.offer(event);
        if (accepted) {
          log.debug("Routed event {} to emailQueue", event.getEventId());
        } else {
          log.warn(
              "emailQueue full! Event {} dropped from RAM. Deferring to DynamoDB Poller.",
              event.getEventId());
          // logic here of dropping it
        }
      }
      default ->
          log.warn(
              "Unknown channel '{}' on event {} — dropping silently",
              event.getChannel(),
              event.getEventId());
    }
  }

  @Override
  public void dispatch(Notification notification, NotificationType type) {
    dispatch(notification, type, null, null, null, null, null, null);
  }

  @Override
  public void dispatch(
      Notification notification,
      NotificationType type,
      Long interviewId,
      Instant date,
      Instant endTime,
      Integer durationMinutes,
      String ownerUsername,
      String ownerAccount) {

    if (notification == null) {
      log.warn("dispatch() called with null notification — ignoring");
      return;
    }

    UUID recipientId = UUID.fromString(notification.getRecipientId());
    String recipientEmail = notification.getReciepentEmail();

    if (notification instanceof EmailSendable emailSendable) {
      ScheduleNotification emailEvent =
          ScheduleNotification.builder()
              .eventId(notification.getNotificationId())
              .type(type)
              .channel(Channel.EMAIL)
              .recipientId(recipientId)
              .recipientEmail(recipientEmail)
              .interviewId(interviewId)
              .date(date)
              .endTime(endTime)
              .durationMinutes(durationMinutes)
              .OwnerUsername(ownerUsername)
              .OwnerAccount(ownerAccount)
              .payload(
                  Map.of(
                      "subject", emailSendable.getEmailSubject(),
                      "toEmail", recipientEmail,
                      "html", emailSendable.toEmailContent()))
              .build();
      publishEvent(emailEvent);
    }

    if (notification instanceof InAppSendable inAppSendable) {
      ScheduleNotification inAppEvent =
          ScheduleNotification.builder()
              .eventId(notification.getNotificationId())
              .type(type)
              .channel(Channel.IN_APP)
              .recipientId(recipientId)
              .recipientEmail(recipientEmail)
              .interviewId(interviewId)
              .payload(Map.of("content", inAppSendable.toInAppContent()))
              .build();
      publishEvent(inAppEvent);
    }
  }
}
