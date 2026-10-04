package com.innerview.spring.service.impl;

import com.innerview.spring.core.util.RoomUtil;
import com.innerview.spring.dto.InterviewInviteEmailNotification;
import com.innerview.spring.dto.InterviewInviteNotification;
import com.innerview.spring.dto.NotificationRequestedEvent;
import com.innerview.spring.dto.room.InviteDto;
import com.innerview.spring.dto.room.InviteRequest;
import com.innerview.spring.entity.Interview;
import com.innerview.spring.entity.InterviewInvite;
import com.innerview.spring.entity.User;
import com.innerview.spring.enums.InterviewRole;
import com.innerview.spring.enums.InterviewStatus;
import com.innerview.spring.enums.InviteStatus;
import com.innerview.spring.enums.NotificationType;
import com.innerview.spring.exception.ApiException;
import com.innerview.spring.repository.InterviewInviteRepository;
import com.innerview.spring.repository.InterviewRepository;
import com.innerview.spring.repository.UserRepository;
import com.innerview.spring.service.RoomService;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Invitations by email. Invitees join the room directly (no lobby), get an email with the link
 * and a calendar entry, and reminders before scheduled interviews.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InviteService {

  static final int MAX_INVITES_PER_INTERVIEW = 50;

  private final InterviewInviteRepository inviteRepository;
  private final InterviewRepository interviewRepository;
  private final UserRepository userRepository;
  private final ApplicationEventPublisher events;
  private final ObjectProvider<RoomService> roomService; // lazy: RoomService doesn't depend on invites

  @Value("${frontend.url}")
  private String frontendUrl;

  /** All or nothing: one bad invitee rolls back the whole list, and no emails go out. */
  @Transactional
  public List<InviteDto> invite(Long interviewId, List<InviteRequest.Invitee> invitees, UUID actorId) {
    Interview interview = interview(interviewId);
    requireCanInvite(interview, actorId);
    return invite(interview, invitees, actorId);
  }

  /** Also used while creating an interview (the creator is the actor), inside its transaction. */
  public List<InviteDto> invite(Interview interview, List<InviteRequest.Invitee> invitees, UUID actorId) {
    if (invitees == null || invitees.isEmpty()) return List.of();
    if (interview.getStatus() == InterviewStatus.COMPLETED
        || interview.getStatus() == InterviewStatus.CANCELLED
        || interview.getStatus() == InterviewStatus.GHOSTED) {
      throw ApiException.gone("ENDED", "This interview has ended");
    }
    User inviter = userRepository.findById(actorId).orElseThrow();
    User owner = userRepository.findById(interview.getOwnerId()).orElseThrow();
    long existing = inviteRepository.findByInterviewIdAndStatusNot(interview.getId(), InviteStatus.REVOKED).size();

    List<InviteDto> result = new ArrayList<>();
    for (InviteRequest.Invitee invitee : invitees) {
      String email = invitee.email().trim().toLowerCase(Locale.ROOT);
      if (email.equalsIgnoreCase(owner.getEmail())) continue; // the host doesn't need an invite
      InterviewRole role = parseRole(invitee.role());

      Optional<InterviewInvite> current = inviteRepository.findByInterviewIdAndEmailIgnoreCase(interview.getId(), email);
      // Revoked invites aren't in `existing`, so bringing one back counts like a new one.
      boolean adds = current.isEmpty() || current.get().getStatus() == InviteStatus.REVOKED;
      if (adds && ++existing > MAX_INVITES_PER_INTERVIEW) {
        throw ApiException.badRequest("TOO_MANY_INVITES", "An interview can have at most " + MAX_INVITES_PER_INTERVIEW + " invitees");
      }
      InterviewInvite invite = current.orElseGet(InterviewInvite::new);
      boolean resend = current.isEmpty() || invite.getStatus() == InviteStatus.REVOKED || invite.getRole() != role;
      invite.setInterviewId(interview.getId());
      invite.setEmail(email);
      invite.setRole(role);
      invite.setInvitedBy(actorId);
      if (invite.getStatus() == null || invite.getStatus() == InviteStatus.REVOKED || invite.getStatus() == InviteStatus.DECLINED) {
        invite.setStatus(InviteStatus.PENDING);
      }
      Optional<User> account = userRepository.findByEmail(email);
      account.ifPresent(user -> invite.setUserId(user.getId()));
      InterviewInvite saved;
      try {
        saved = inviteRepository.save(invite);
      } catch (DataIntegrityViolationException e) {
        // Another request invited the same email between our lookup and this insert (unique
        // interview_id + email). The transaction is rolled back, so nothing from this request stays.
        throw ApiException.conflict("ALREADY_INVITED", email + " was just invited by someone else. Refresh and try again.");
      }
      result.add(dto(saved));
      if (resend) sendInvite(interview, saved, inviter, account.orElse(null));
    }
    return result;
  }

  public List<InviteDto> list(Long interviewId, UUID actorId) {
    Interview interview = interview(interviewId);
    requireCanInvite(interview, actorId);
    return inviteRepository.findByInterviewIdAndStatusNot(interviewId, InviteStatus.REVOKED).stream().map(InviteService::dto).toList();
  }

  public void revoke(Long interviewId, Long inviteId, UUID actorId) {
    Interview interview = interview(interviewId);
    requireCanInvite(interview, actorId);
    InterviewInvite invite = inviteRepository.findById(inviteId)
        .filter(i -> i.getInterviewId().equals(interviewId))
        .orElseThrow(() -> ApiException.notFound("Invite not found"));
    invite.setStatus(InviteStatus.REVOKED);
    inviteRepository.save(invite);
    // A revoked invite alone doesn't remove someone who already joined (or let them back in).
    Optional.ofNullable(invite.getUserId())
        .or(() -> userRepository.findByEmail(invite.getEmail()).map(User::getId))
        .ifPresent(userId -> roomService.getObject().removeRevokedInvitee(interview.getRoomId(), actorId, userId));
  }

  /** The owner, or the host/an interviewer while the interview is live. */
  private void requireCanInvite(Interview interview, UUID actorId) {
    if (interview.getOwnerId().equals(actorId)) return;
    String code = RoomUtil.canonical(interview.getRoomId());
    try {
      RoomService rooms = roomService.getObject();
      if (rooms.isLive(code) && rooms.requireActiveParticipant(code, actorId).getRole() == InterviewRole.INTERVIEWER) return;
    } catch (ApiException ignored) {
      // falls through to the error below
    }
    throw ApiException.forbidden("NOT_HOST", "Only the host or an interviewer can invite people");
  }

  private void sendInvite(Interview interview, InterviewInvite invite, User inviter, User account) {
    Instant start = interview.getStartTime() == null || interview.getStartTime().isBefore(Instant.now()) ? Instant.now() : interview.getStartTime();
    int minutes = interview.getDurationMinutes() == null ? 60 : interview.getDurationMinutes();
    String link = frontendUrl + "/" + RoomUtil.format(RoomUtil.canonical(interview.getRoomId()));
    InterviewInviteEmailNotification notification =
        account == null
            ? new InterviewInviteEmailNotification(null, invite.getEmail(), inviter.getName(), interview.getTitle(), interview.getType(), invite.getRole().name(), start, start.plus(Duration.ofMinutes(minutes)), link)
            : new InterviewInviteNotification(account.getId(), invite.getEmail(), inviter.getName(), interview.getTitle(), interview.getType(), invite.getRole().name(), start, start.plus(Duration.ofMinutes(minutes)), link);
    // Sent after commit (AfterCommitNotificationSender), so a rolled-back request emails nobody.
    events.publishEvent(new NotificationRequestedEvent(notification, NotificationType.INTERVIEW_INVITE));
  }

  static InterviewRole parseRole(String role) {
    if (role == null) return InterviewRole.INTERVIEWEE;
    return switch (role.trim().toUpperCase(Locale.ROOT)) {
      case "INTERVIEWER", "CO_HOST", "COHOST" -> InterviewRole.INTERVIEWER;
      case "OBSERVER" -> InterviewRole.OBSERVER;
      case "INTERVIEWEE", "CANDIDATE" -> InterviewRole.INTERVIEWEE;
      default -> throw ApiException.badRequest("INVALID_ROLE", "Role must be interviewer, candidate or observer");
    };
  }

  static InviteDto dto(InterviewInvite invite) {
    return new InviteDto(invite.getId(), invite.getEmail(), invite.getRole().name(), invite.getStatus().name(), invite.getUserId(), invite.getCreatedAt());
  }

  private Interview interview(Long id) {
    return interviewRepository.findById(id).orElseThrow(() -> ApiException.notFound("Interview not found"));
  }
}
