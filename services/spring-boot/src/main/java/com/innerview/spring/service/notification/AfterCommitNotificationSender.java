package com.innerview.spring.service.notification;

import com.innerview.spring.dto.NotificationRequestedEvent;
import com.innerview.spring.service.NotificationPublisherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/** Hands notifications to the send pipeline only after the transaction that requested them commits. */
@Slf4j
@Component
@RequiredArgsConstructor
public class AfterCommitNotificationSender {

  private final NotificationPublisherService notifications;

  /** Discarded on rollback; runs immediately when published outside a transaction. */
  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
  public void onNotificationRequested(NotificationRequestedEvent event) {
    try {
      notifications.dispatch(
          event.notification(),
          event.type(),
          event.interviewId(),
          event.date(),
          event.endTime(),
          event.durationMinutes(),
          event.ownerUsername(),
          event.ownerAccount());
    } catch (Exception e) {
      // Never fail the caller: the data is already committed.
      log.warn("[Notification] Could not send {} to {}: {}",
          event.type(), event.notification().getReciepentEmail(), e.getMessage());
    }
  }
}
