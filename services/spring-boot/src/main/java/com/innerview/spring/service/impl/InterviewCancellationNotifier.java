package com.innerview.spring.service.impl;

import com.innerview.spring.dto.InterviewCancelledEmailNotification;
import com.innerview.spring.dto.InterviewCancelledNotification;
import com.innerview.spring.dto.NotificationRequestedEvent;
import com.innerview.spring.entity.Interview;
import com.innerview.spring.entity.InterviewInvite;
import com.innerview.spring.entity.User;
import com.innerview.spring.enums.InviteStatus;
import com.innerview.spring.enums.NotificationType;
import com.innerview.spring.repository.InterviewInviteRepository;
import com.innerview.spring.repository.UserRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

/**
 * Tells everyone still invited that an interview was cancelled. Shared by every cancel path (the
 * host's cancel, ending a room nobody entered, the owner deleting their account). Call it inside
 * the cancelling transaction: the notifications are sent only after it commits.
 */
@Component
@RequiredArgsConstructor
public class InterviewCancellationNotifier {

  private final InterviewInviteRepository inviteRepository;
  private final UserRepository userRepository;
  private final ApplicationEventPublisher events;

  /** {@code cancelledBy} isn't notified about their own action. */
  public void notifyCancelled(Interview interview, UUID cancelledBy) {
    String actorEmail = cancelledBy == null ? null : userRepository.findById(cancelledBy).map(User::getEmail).orElse(null);
    for (InterviewInvite invite : inviteRepository.findByInterviewIdAndStatusNot(interview.getId(), InviteStatus.REVOKED)) {
      if (invite.getStatus() == InviteStatus.DECLINED) continue;
      if (cancelledBy != null && cancelledBy.equals(invite.getUserId())) continue;
      if (actorEmail != null && actorEmail.equalsIgnoreCase(invite.getEmail())) continue;
      InterviewCancelledEmailNotification notification =
          invite.getUserId() == null
              ? new InterviewCancelledEmailNotification(null, invite.getEmail(), interview.getTitle(), interview.getType(), interview.getStartTime())
              : new InterviewCancelledNotification(invite.getUserId(), invite.getEmail(), interview.getTitle(), interview.getType(), interview.getStartTime());
      events.publishEvent(new NotificationRequestedEvent(notification, NotificationType.INTERVIEW_CANCELLED));
    }
  }
}
