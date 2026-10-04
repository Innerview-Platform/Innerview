package com.innerview.spring.service.impl;

import com.innerview.spring.core.config.StompPrincipal;
import com.innerview.spring.core.util.RateLimiter;
import com.innerview.spring.core.util.RoomTicketService;
import com.innerview.spring.core.util.RoomUtil;
import com.innerview.spring.dto.JoinRequestNotification;
import com.innerview.spring.dto.room.AccessInfoDto;
import com.innerview.spring.dto.room.AccessRequestDto;
import com.innerview.spring.dto.room.ChatMessageDto;
import com.innerview.spring.dto.room.JoinResultDto;
import com.innerview.spring.dto.room.ParticipantDto;
import com.innerview.spring.dto.room.RoomStateDto;
import com.innerview.spring.dto.room.TicketDto;
import com.innerview.spring.entity.AccessRequest;
import com.innerview.spring.entity.ActiveRoom;
import com.innerview.spring.entity.Interview;
import com.innerview.spring.entity.InterviewInvite;
import com.innerview.spring.entity.InterviewMessage;
import com.innerview.spring.entity.RoomParticipant;
import com.innerview.spring.entity.RoomUiConfig;
import com.innerview.spring.entity.User;
import com.innerview.spring.entity.UserInterview;
import com.innerview.spring.entity.UserInterviewId;
import com.innerview.spring.enums.AccessPolicy;
import com.innerview.spring.enums.InterviewEndReason;
import com.innerview.spring.enums.InterviewRole;
import com.innerview.spring.enums.InterviewStatus;
import com.innerview.spring.enums.InviteStatus;
import com.innerview.spring.enums.NotificationType;
import com.innerview.spring.enums.RoomParticipantStatus;
import com.innerview.spring.exception.ApiException;
import com.innerview.spring.repository.InterviewInviteRepository;
import com.innerview.spring.repository.InterviewMessageRepository;
import com.innerview.spring.repository.InterviewRepository;
import com.innerview.spring.repository.UserInterviewRepository;
import com.innerview.spring.repository.UserRepository;
import com.innerview.spring.service.CodeRunnerService;
import com.innerview.spring.service.NotificationPublisherService;
import com.innerview.spring.service.RoomService;
import com.innerview.spring.service.SfuService;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.concurrent.ConcurrentHashMap;
import lombok.extern.slf4j.Slf4j;
import com.innerview.spring.dto.stats.UserStatsChangedEvent;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class RoomServiceImpl implements RoomService {

  static final Duration RECONNECT_GRACE = Duration.ofSeconds(60);
  static final Duration EMPTY_ROOM_TIMEOUT = Duration.ofMinutes(10);
  static final Duration LOBBY_REQUEST_TTL = Duration.ofMinutes(10);
  static final Duration EARLY_JOIN = Duration.ofMinutes(10);
  static final Duration TIME_WARNING = Duration.ofMinutes(5);
  static final Duration EXTENSION = Duration.ofMinutes(15);
  static final int MAX_DENIALS = 3;
  static final int MAX_CHAT_LENGTH = 2000;

  private record SessionRef(String code, UUID userId, String clientId) {}

  private final Map<String, ActiveRoom> rooms = new ConcurrentHashMap<>();
  private final Map<String, SessionRef> sessions = new ConcurrentHashMap<>();

  private final InterviewRepository interviewRepository;
  private final UserRepository userRepository;
  private final UserInterviewRepository userInterviewRepository;
  private final InterviewInviteRepository inviteRepository;
  private final InterviewMessageRepository messageRepository;
  private final SimpMessagingTemplate messaging;
  private final RoomTicketService ticketService;
  private final RateLimiter rateLimiter;
  private final CodeRunnerService codeRunnerService;
  private final SfuService sfuService;
  private final CollaborationGateway collaboration;
  private final NotificationPublisherService notifications;
  private final ApplicationEventPublisher events;
  private final AvatarLookup avatars;
  private final String frontendUrl;

  public RoomServiceImpl(
      InterviewRepository interviewRepository,
      UserRepository userRepository,
      UserInterviewRepository userInterviewRepository,
      InterviewInviteRepository inviteRepository,
      InterviewMessageRepository messageRepository,
      SimpMessagingTemplate messaging,
      RoomTicketService ticketService,
      RateLimiter rateLimiter,
      @Lazy CodeRunnerService codeRunnerService,
      SfuService sfuService,
      CollaborationGateway collaboration,
      NotificationPublisherService notifications,
      ApplicationEventPublisher events,
      AvatarLookup avatars,
      MeterRegistry meterRegistry,
      @Value("${frontend.url}") String frontendUrl) {
    this.interviewRepository = interviewRepository;
    this.userRepository = userRepository;
    this.userInterviewRepository = userInterviewRepository;
    this.inviteRepository = inviteRepository;
    this.messageRepository = messageRepository;
    this.messaging = messaging;
    this.ticketService = ticketService;
    this.rateLimiter = rateLimiter;
    this.codeRunnerService = codeRunnerService;
    this.sfuService = sfuService;
    this.collaboration = collaboration;
    this.notifications = notifications;
    this.events = events;
    this.avatars = avatars;
    this.frontendUrl = frontendUrl;

    Gauge.builder("innerview.rooms.live", rooms, r -> r.values().stream().filter(ActiveRoom::isLive).count())
        .description("Interview rooms with the call in progress")
        .register(meterRegistry);
    Gauge.builder("innerview.participants.connected", rooms, r -> r.values().stream().mapToLong(ActiveRoom::activeCount).sum())
        .description("People connected to interview rooms")
        .register(meterRegistry);
    Gauge.builder("innerview.lobby.waiting", rooms, r -> r.values().stream()
            .flatMap(room -> room.getRequests().values().stream())
            .filter(req -> req.getStatus() == AccessRequest.Status.PENDING)
            .count())
        .description("People waiting in lobbies")
        .register(meterRegistry);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Entering
  // ═══════════════════════════════════════════════════════════════════════════

  @Override
  public AccessInfoDto getAccess(String rawCode, UUID userId) {
    Interview interview = findInterview(rawCode, userId);
    User user = user(userId);
    String code = codeOf(interview);
    User owner = userRepository.findById(interview.getOwnerId()).orElse(null);
    ActiveRoom room = rooms.get(code);
    boolean isOwner = interview.getOwnerId().equals(userId);
    Optional<InterviewInvite> invite = activeInvite(interview.getId(), user.getEmail());
    RoomParticipant participant = room == null ? null : room.getParticipants().get(userId);
    AccessRequest pending = room == null ? null : findRequest(room, userId, AccessRequest.Status.PENDING);
    AccessRequest admitted = room == null ? null : findRequest(room, userId, AccessRequest.Status.ADMITTED);
    AccessPolicy policy = room != null ? room.getAccessPolicy() : interview.effectiveAccessPolicy();
    Instant joinOpensAt = interview.getStartTime() == null ? null : interview.getStartTime().minus(EARLY_JOIN);

    String access;
    boolean canJoin = false;
    InterviewRole role = null;

    if (interview.getStatus() == InterviewStatus.CANCELLED) {
      access = "CANCELLED";
    } else if (isEnded(interview)) {
      access = "ENDED";
    } else if (room != null && room.getBlocked().contains(userId)) {
      access = "REMOVED";
    } else if (!isOwner && joinOpensAt != null && Instant.now().isBefore(joinOpensAt)) {
      access = "NOT_STARTED";
    } else {
      if (isOwner) {
        access = "HOST";
        role = ownerRole(interview);
      } else if (invite.isPresent()) {
        access = "INVITED";
        role = invite.get().getRole();
      } else if (participant != null) {
        access = "ADMITTED";
        role = participant.getRole();
      } else if (admitted != null) {
        access = "ADMITTED";
        role = admitted.getAdmittedRole();
      } else if (policy == AccessPolicy.OPEN) {
        access = "OPEN";
        role = InterviewRole.INTERVIEWEE;
      } else if (policy == AccessPolicy.INVITE_ONLY) {
        access = "NOT_INVITED";
      } else if (pending != null) {
        access = "PENDING";
      } else if (room != null && room.getDenials().getOrDefault(userId, 0) >= MAX_DENIALS) {
        access = "DENIED";
      } else {
        access = "MUST_ASK";
      }

      if (role != null) {
        boolean alreadyInside = participant != null && participant.isActive();
        if (room != null && !alreadyInside && isFull(room)) access = "FULL";
        else canJoin = true;
      }
    }

    List<String> inside =
        room == null
            ? List.of()
            : room.getParticipants().values().stream()
                .filter(RoomParticipant::isActive)
                .sorted(Comparator.comparing(RoomParticipant::getJoinedAt))
                .map(RoomParticipant::getName)
                .toList();

    return new AccessInfoDto(
        code,
        RoomUtil.format(code),
        interview.getId(),
        interview.getTitle(),
        interview.getType() == null ? null : interview.getType().name(),
        owner == null ? null : owner.getName(),
        interview.getStartTime(),
        room != null && room.getEndsAt() != null ? room.getEndsAt() : interview.getEndTime(),
        policy.name(),
        access,
        canJoin,
        role == null ? null : role.name(),
        inside,
        joinOpensAt,
        pending == null ? null : pending.getId(),
        participant != null && !participant.getSessions().isEmpty());
  }

  @Override
  public JoinResultDto join(String rawCode, UUID userId) {
    AccessInfoDto access = getAccess(rawCode, userId);
    if (!access.canJoin()) throw accessError(access.access());

    Interview interview = interviewRepository.findById(access.interviewId()).orElseThrow();
    User user = user(userId);
    ActiveRoom room = getOrCreateRoom(interview);
    synchronized (room) {
      if (!room.isLive()) goLive(room, interview);
      InterviewRole role = InterviewRole.valueOf(access.role());
      RoomParticipant participant =
          room.getParticipants()
              .computeIfAbsent(
                  userId,
                  id -> {
                    RoomParticipant p = new RoomParticipant();
                    p.setUserId(id);
                    p.setName(user.getName());
                    p.setUsername(user.getUsername());
                    p.setAvatarThumbUrl(avatars.thumbnail(id));
                    p.setRole(role);
                    p.setJoinedAt(Instant.now());
                    return p;
                  });
      // Reserve the seat until the socket connects (or the grace period ends).
      if (!participant.isActive()) {
        participant.setStatus(RoomParticipantStatus.RECONNECTING);
        participant.setDisconnectedAt(Instant.now());
      }
      if (userId.equals(room.getOwnerId()) || room.getHostId() == null) room.setHostId(userId);
      room.setEmptySince(null);
      recordParticipation(interview, userId, participant.getRole());
      activeInvite(interview.getId(), user.getEmail())
          .filter(invite -> invite.getStatus() != InviteStatus.ACCEPTED || invite.getUserId() == null)
          .ifPresent(invite -> {
            invite.setStatus(InviteStatus.ACCEPTED);
            invite.setUserId(userId);
            inviteRepository.save(invite);
          });

      broadcastState(room);
      JoinResultDto.MeDto me = me(room, participant);
      return new JoinResultDto(
          ticket(room, participant, false, RoomTicketService.TICKET_TTL_MS),
          state(room),
          me,
          !participant.getSessions().isEmpty());
    }
  }

  @Override
  public TicketDto issueTicket(String rawCode, UUID userId) {
    ActiveRoom room = liveRoom(rawCode);
    RoomParticipant p = room.getParticipants().get(userId);
    if (p == null || room.getBlocked().contains(userId)) throw ApiException.forbidden("NOT_A_MEMBER", "Join the interview first");
    JoinResultDto.MeDto me = me(room, p);
    return new TicketDto(ticket(room, p, false, RoomTicketService.TICKET_TTL_MS), me.role(), me.staff(), me.host(), me.readonly());
  }

  @Override
  public TicketDto issueReviewTicket(Long interviewId, UUID userId) {
    Interview interview = interviewRepository.findById(interviewId).orElseThrow(() -> ApiException.notFound("Interview not found"));
    boolean owner = interview.getOwnerId().equals(userId);
    Optional<UserInterview> participation = userInterviewRepository.findById(new UserInterviewId(userId, interviewId));
    if (!owner && participation.isEmpty()) throw ApiException.forbidden("NOT_A_PARTICIPANT", "Only participants can review this interview");
    InterviewRole role = participation.map(UserInterview::getRole).orElse(ownerRole(interview));
    boolean staff = owner || role == InterviewRole.INTERVIEWER;
    String ticket =
        ticketService.issue(userId, codeOf(interview), role.name(), user(userId).getName(), staff, owner, true, RoomTicketService.REVIEW_TTL_MS);
    return new TicketDto(ticket, role.name(), staff, owner, true);
  }

  @Override
  public AccessRequestDto knock(String rawCode, UUID userId) {
    AccessInfoDto access = getAccess(rawCode, userId);
    rateLimiter.check("knock:" + access.code() + ":" + userId, 5, Duration.ofMinutes(1), "Too many requests — wait a minute before asking again");
    Interview interview = interviewRepository.findById(access.interviewId()).orElseThrow();
    ActiveRoom room = getOrCreateRoom(interview);

    if ("PENDING".equals(access.access())) return dto(room.getRequests().get(access.requestId()));
    if (!"MUST_ASK".equals(access.access())) throw accessError(access.access());

    User user = user(userId);
    AccessRequest request = new AccessRequest();
    request.setId(UUID.randomUUID().toString());
    request.setUserId(userId);
    request.setName(user.getName());
    request.setEmail(user.getEmail());
    request.setRequestedAt(Instant.now());
    room.getRequests().put(request.getId(), request);

    AccessRequestDto dto = dto(request);
    boolean staffPresent = notifyStaff(room, Map.of("type", "REQUEST", "room", room.getCode(), "request", dto));
    if (!staffPresent) notifyOwnerOfWaitingGuest(room, user.getName());
    log.info("[Room {}] {} asked to join", room.getCode(), userId);
    return dto;
  }

  @Override
  public void cancelKnock(String rawCode, UUID userId) {
    ActiveRoom room = rooms.get(RoomUtil.canonical(rawCode));
    if (room == null) return;
    AccessRequest request = findRequest(room, userId, AccessRequest.Status.PENDING);
    if (request == null) return;
    request.setStatus(AccessRequest.Status.CANCELLED);
    notifyStaff(room, Map.of("type", "RESOLVED", "room", room.getCode(), "request", dto(request)));
  }

  @Override
  public List<AccessRequestDto> pendingRequests(String rawCode, UUID actorId) {
    ActiveRoom room = liveRoom(rawCode);
    requireStaff(room, actorId);
    return room.getRequests().values().stream()
        .filter(r -> r.getStatus() == AccessRequest.Status.PENDING)
        .sorted(Comparator.comparing(AccessRequest::getRequestedAt))
        .map(this::dto)
        .toList();
  }

  @Override
  public void decide(String rawCode, String requestId, UUID actorId, boolean admit, InterviewRole role) {
    ActiveRoom room = liveRoom(rawCode);
    requireStaff(room, actorId);
    AccessRequest request = room.getRequests().get(requestId);
    if (request == null || request.getStatus() != AccessRequest.Status.PENDING) {
      throw ApiException.conflict("REQUEST_CLOSED", "This request was already handled");
    }
    synchronized (room) {
      if (admit) {
        if (isFull(room)) throw ApiException.conflict("ROOM_FULL", "The room is full");
        request.setStatus(AccessRequest.Status.ADMITTED);
        request.setAdmittedRole(role == null || role == InterviewRole.BOTH ? InterviewRole.INTERVIEWEE : role);
      } else {
        request.setStatus(AccessRequest.Status.DENIED);
        room.getDenials().merge(request.getUserId(), 1, Integer::sum);
      }
      request.setDecidedBy(nameOf(room, actorId));
    }
    notifyStaff(room, Map.of("type", "RESOLVED", "room", room.getCode(), "request", dto(request)));
    log.info("[Room {}] {} {} {}", room.getCode(), actorId, admit ? "admitted" : "denied", request.getUserId());
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // In the room
  // ═══════════════════════════════════════════════════════════════════════════

  @Override
  public RoomStateDto getState(String rawCode, UUID userId) {
    ActiveRoom room = liveRoom(rawCode);
    requireActive(room, userId);
    return state(room);
  }

  @Override
  public RoomParticipant requireActiveParticipant(String rawCode, UUID userId) {
    return requireActive(liveRoom(rawCode), userId);
  }

  @Override
  public void leave(String rawCode, UUID userId) {
    ActiveRoom room = rooms.get(RoomUtil.canonical(rawCode));
    if (room == null) return; // already ended or never opened: leaving is a no-op
    RoomParticipant p = room.getParticipants().get(userId);
    if (p == null || p.getStatus() == RoomParticipantStatus.LEFT) return;
    synchronized (room) {
      p.setStatus(RoomParticipantStatus.LEFT);
      p.getSessions().keySet().forEach(sessions::remove);
      p.getSessions().clear();
      handOffHostIfNeeded(room);
    }
    broadcastState(room);
  }

  @Override
  public void removeParticipant(String rawCode, UUID actorId, UUID targetId) {
    ActiveRoom room = liveRoom(rawCode);
    requireStaff(room, actorId);
    if (targetId.equals(room.getOwnerId())) throw ApiException.forbidden("CANNOT_REMOVE_OWNER", "The interview's creator can't be removed");
    if (targetId.equals(actorId)) throw ApiException.badRequest("CANNOT_REMOVE_SELF", "Use Leave instead");
    RoomParticipant p = room.getParticipants().get(targetId);
    if (p == null) throw ApiException.notFound("That person isn't in this interview");
    synchronized (room) {
      room.getBlocked().add(targetId);
      p.setStatus(RoomParticipantStatus.LEFT);
      p.getSessions().keySet().forEach(sessions::remove);
      p.getSessions().clear();
      room.getRequests().values().stream()
          .filter(r -> r.getUserId().equals(targetId) && r.getStatus() == AccessRequest.Status.PENDING)
          .forEach(r -> r.setStatus(AccessRequest.Status.DENIED));
      handOffHostIfNeeded(room);
    }
    toUser(targetId, "/queue/session", Map.of("type", "REMOVED", "room", room.getCode(), "by", nameOf(room, actorId)));
    collaboration.revokeUser(room.getCode(), targetId, null, true);
    sfuService.removeParticipant(room.getCode(), targetId);
    broadcastState(room);
    log.info("[Room {}] {} removed {}", room.getCode(), actorId, targetId);
  }

  @Override
  public void changeRole(String rawCode, UUID actorId, UUID targetId, InterviewRole role) {
    ActiveRoom room = liveRoom(rawCode);
    requireHost(room, actorId);
    if (role == null || role == InterviewRole.BOTH) throw ApiException.badRequest("INVALID_ROLE", "Choose interviewer, candidate or observer");
    RoomParticipant p = room.getParticipants().get(targetId);
    if (p == null) throw ApiException.notFound("That person isn't in this interview");
    if (p.getRole() == role) return;
    p.setRole(role);
    permissionsChanged(room, p);
    broadcastState(room);
  }

  @Override
  public void swapRoles(String rawCode, UUID actorId) {
    ActiveRoom room = liveRoom(rawCode);
    requireHost(room, actorId);
    List<RoomParticipant> changed = room.getParticipants().values().stream()
        .filter(p -> p.getRole() == InterviewRole.INTERVIEWER || p.getRole() == InterviewRole.INTERVIEWEE)
        .toList();
    if (changed.stream().noneMatch(p -> p.getRole() == InterviewRole.INTERVIEWEE)) {
      throw ApiException.conflict("NO_CANDIDATE", "There's no candidate to swap with");
    }
    for (RoomParticipant p : changed) {
      p.setRole(p.getRole() == InterviewRole.INTERVIEWER ? InterviewRole.INTERVIEWEE : InterviewRole.INTERVIEWER);
      permissionsChanged(room, p);
    }
    messaging.convertAndSend(topic(room, "notice"), Map.of("type", "ROLES_SWAPPED", "by", nameOf(room, actorId)));
    broadcastState(room);
  }

  @Override
  public void setAccessPolicy(String rawCode, UUID actorId, AccessPolicy policy) {
    if (policy == null) throw ApiException.badRequest("INVALID_POLICY", "Choose an access policy");
    ActiveRoom room = liveRoom(rawCode);
    requireHost(room, actorId);
    room.setAccessPolicy(policy);
    interviewRepository.findById(room.getInterviewId()).ifPresent(interview -> {
      interview.setAccessPolicy(policy);
      interviewRepository.save(interview);
    });
    broadcastState(room);
  }

  @Override
  public void extend(String rawCode, UUID actorId) {
    ActiveRoom room = liveRoom(rawCode);
    requireHost(room, actorId);
    if (room.isExtended()) throw ApiException.conflict("ALREADY_EXTENDED", "The interview was already extended once");
    room.setEndsAt(room.getEndsAt().plus(EXTENSION));
    room.setExtended(true);
    room.setWarningSent(false);
    interviewRepository.findById(room.getInterviewId()).ifPresent(interview -> {
      interview.setEndTime(room.getEndsAt());
      interview.setExtended(true);
      if (interview.getDurationMinutes() != null) interview.setDurationMinutes(interview.getDurationMinutes() + (int) EXTENSION.toMinutes());
      interviewRepository.save(interview);
    });
    messaging.convertAndSend(topic(room, "notice"), Map.of("type", "EXTENDED", "endsAt", room.getEndsAt().toString(), "by", nameOf(room, actorId)));
    broadcastState(room);
  }

  @Override
  public ChatMessageDto sendChat(String rawCode, UUID userId, String text) {
    ActiveRoom room = liveRoom(rawCode);
    RoomParticipant p = requireActive(room, userId);
    String body = text == null ? "" : text.strip();
    if (body.isEmpty()) throw ApiException.badRequest("EMPTY_MESSAGE", "Message is empty");
    if (body.length() > MAX_CHAT_LENGTH) throw ApiException.badRequest("MESSAGE_TOO_LONG", "Messages are limited to " + MAX_CHAT_LENGTH + " characters");
    rateLimiter.check("chat:" + userId, 20, Duration.ofSeconds(10), "You're sending messages too fast");

    InterviewMessage message = new InterviewMessage();
    message.setInterviewId(room.getInterviewId());
    message.setSenderId(userId);
    message.setSenderName(p.getName());
    message.setText(body);
    message.setSentAt(Instant.now());
    ChatMessageDto dto = dto(messageRepository.save(message));
    messaging.convertAndSend(topic(room, "chat"), dto);
    return dto;
  }

  @Override
  public List<ChatMessageDto> chatHistory(String rawCode, UUID userId) {
    ActiveRoom room = liveRoom(rawCode);
    requireActive(room, userId);
    return messageRepository.findByInterviewIdOrderBySentAtAsc(room.getInterviewId()).stream().map(this::dto).toList();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Ending
  // ═══════════════════════════════════════════════════════════════════════════

  @Override
  public void endInterview(String rawCode, UUID actorId) {
    Interview interview = findInterview(rawCode, actorId);
    if (isEnded(interview) || interview.getStatus() == InterviewStatus.CANCELLED) {
      throw ApiException.gone("ENDED", "This interview has already ended");
    }
    ActiveRoom room = rooms.get(codeOf(interview));
    boolean allowed = interview.getOwnerId().equals(actorId) || (room != null && room.isLive() && room.isStaff(actorId));
    if (!allowed) throw ApiException.forbidden("NOT_HOST", "Only the host or an interviewer can end the interview");
    endInterview(interview, InterviewEndReason.ENDED_BY_HOST);
  }

  @Override
  public synchronized void endInterview(Interview interview, InterviewEndReason reason) {
    String code = codeOf(interview);
    ActiveRoom room = rooms.remove(code);
    boolean wasLive = room != null && room.isLive() || interview.getLiveSince() != null;

    if (room != null) codeRunnerService.stopRoom(code);
    if (wasLive) {
      Map<String, String> texts = collaboration.flushDocuments(code);
      if (texts.get("code") != null) interview.setSharedCode(texts.get("code"));
      if (texts.get("notes") != null) interview.setProblemNotes(texts.get("notes"));
      if (texts.get("private") != null) interview.setInterviewerNotes(texts.get("private"));
    }

    if (!wasLive) {
      // Never entered: an explicit end is a cancellation, otherwise nobody showed up.
      interview.setStatus(reason == InterviewEndReason.ENDED_BY_HOST ? InterviewStatus.CANCELLED : InterviewStatus.GHOSTED);
    } else {
      interview.setStatus(InterviewStatus.COMPLETED);
      interview.setEndTime(Instant.now());
    }
    interviewRepository.save(interview);
    if (interview.getStatus() == InterviewStatus.COMPLETED) {
      // Participants' "total interviews" on their profiles.
      events.publishEvent(new UserStatsChangedEvent(userInterviewRepository.findByIdInterviewId(interview.getId()).stream()
          .map(participation -> participation.getId().getUserId())
          .collect(Collectors.toSet())));
    }

    if (room != null) {
      room.getParticipants().values().forEach(p -> p.getSessions().keySet().forEach(sessions::remove));
      messaging.convertAndSend(
          topic(room, "close"),
          Map.of("reason", reason.name(), "message", reason.message(), "interviewId", interview.getId()));
      room.getRequests().values().stream()
          .filter(r -> r.getStatus() == AccessRequest.Status.PENDING)
          .forEach(r -> r.setStatus(AccessRequest.Status.EXPIRED));
    }
    if (wasLive) collaboration.closeRoom(code);
    log.info("[Room {}] Interview {} ended: {}", code, interview.getId(), reason);
  }

  @Override
  public boolean isLive(String rawCode) {
    ActiveRoom room = rooms.get(RoomUtil.canonical(rawCode));
    return room != null && room.isLive();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Presence
  // ═══════════════════════════════════════════════════════════════════════════

  @Override
  public StompPrincipal connect(String rawTicket, String sessionId, String clientId, boolean takeover) {
    RoomTicketService.Ticket ticket = ticketService.verify(rawTicket);
    if (ticket == null) throw new MessagingException("unauthorized");
    ActiveRoom room = rooms.get(ticket.room());
    if (room == null || !room.isLive()) throw new MessagingException("room-closed");
    RoomParticipant p = room.getParticipants().get(ticket.userId());
    if (p == null || room.getBlocked().contains(ticket.userId())) throw new MessagingException("not-a-member");

    synchronized (room) {
      if (takeover) {
        for (String otherClient : p.getSessions().values()) {
          if (!otherClient.equals(clientId)) {
            toUser(p.getUserId(), "/queue/session", Map.of("type", "REPLACED", "room", room.getCode(), "clientId", clientId));
            break;
          }
        }
      }
      p.getSessions().put(sessionId, clientId == null ? sessionId : clientId);
      p.setStatus(RoomParticipantStatus.CONNECTED);
      p.setDisconnectedAt(null);
      room.setEmptySince(null);
      if (p.getUserId().equals(room.getOwnerId())) room.setHostId(p.getUserId());
      handOffHostIfNeeded(room);
    }
    sessions.put(sessionId, new SessionRef(room.getCode(), p.getUserId(), clientId));
    broadcastState(room);
    return new StompPrincipal(p.getUserId(), room.getCode(), clientId);
  }

  @Override
  public void disconnect(String sessionId) {
    SessionRef ref = sessions.remove(sessionId);
    if (ref == null) return;
    ActiveRoom room = rooms.get(ref.code());
    if (room == null) return;
    RoomParticipant p = room.getParticipants().get(ref.userId());
    if (p == null) return;
    synchronized (room) {
      p.getSessions().remove(sessionId);
      if (p.getSessions().isEmpty() && p.getStatus() == RoomParticipantStatus.CONNECTED) {
        p.setStatus(RoomParticipantStatus.RECONNECTING);
        p.setDisconnectedAt(Instant.now());
      }
    }
    broadcastState(room);
  }

  @Override
  public void tick() {
    Instant now = Instant.now();
    for (ActiveRoom room : List.copyOf(rooms.values())) {
      boolean changed = false;
      synchronized (room) {
        for (RoomParticipant p : room.getParticipants().values()) {
          if (p.getStatus() == RoomParticipantStatus.RECONNECTING
              && p.getDisconnectedAt() != null
              && p.getDisconnectedAt().plus(RECONNECT_GRACE).isBefore(now)) {
            p.setStatus(RoomParticipantStatus.LEFT);
            changed = true;
          }
        }
        for (AccessRequest r : room.getRequests().values()) {
          if (r.getStatus() == AccessRequest.Status.PENDING && r.getRequestedAt().plus(LOBBY_REQUEST_TTL).isBefore(now)) {
            r.setStatus(AccessRequest.Status.EXPIRED);
            notifyStaff(room, Map.of("type", "RESOLVED", "room", room.getCode(), "request", dto(r)));
          }
        }
        if (changed) handOffHostIfNeeded(room);
      }
      if (changed) broadcastState(room);

      if (!room.isLive()) {
        // Lobby-only room: drop it once nobody is waiting.
        boolean waiting = room.getRequests().values().stream().anyMatch(r -> r.getStatus() == AccessRequest.Status.PENDING);
        if (!waiting && room.getCreatedAt().plus(LOBBY_REQUEST_TTL).isBefore(now)) rooms.remove(room.getCode(), room);
        continue;
      }

      if (room.activeCount() == 0) {
        if (room.getEmptySince() == null) room.setEmptySince(now);
        else if (room.getEmptySince().plus(EMPTY_ROOM_TIMEOUT).isBefore(now)) {
          endByReason(room, InterviewEndReason.EMPTY);
          continue;
        }
      }
      if (room.getEndsAt() != null) {
        if (!now.isBefore(room.getEndsAt())) {
          endByReason(room, InterviewEndReason.TIME_UP);
          continue;
        }
        if (!room.isWarningSent() && !now.isBefore(room.getEndsAt().minus(TIME_WARNING))) {
          room.setWarningSent(true);
          messaging.convertAndSend(topic(room, "notice"), Map.of("type", "TIME_WARNING", "endsAt", room.getEndsAt().toString()));
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Internals
  // ═══════════════════════════════════════════════════════════════════════════

  private void endByReason(ActiveRoom room, InterviewEndReason reason) {
    interviewRepository.findById(room.getInterviewId()).ifPresentOrElse(
        interview -> endInterview(interview, reason),
        () -> rooms.remove(room.getCode()));
  }

  private Interview findInterview(String rawCode, UUID userId) {
    String code = RoomUtil.canonical(rawCode);
    Optional<Interview> interview = code == null ? Optional.empty() : interviewRepository.findByRoomId(code);
    if (interview.isEmpty()) {
      // Unknown codes are rate limited so codes can't be guessed.
      rateLimiter.check("code-miss:" + userId, 20, Duration.ofMinutes(10), "Too many invalid codes — try again later");
      throw ApiException.notFound("No interview found with that code");
    }
    return interview.get();
  }

  private ActiveRoom getOrCreateRoom(Interview interview) {
    return rooms.computeIfAbsent(codeOf(interview), code -> {
      ActiveRoom room = new ActiveRoom();
      room.setCode(code);
      room.setInterviewId(interview.getId());
      room.setType(interview.getType());
      room.setTitle(interview.getTitle());
      room.setOwnerId(interview.getOwnerId());
      room.setOwnerRole(ownerRole(interview));
      room.setMaxParticipants(interview.getRoomSize() == null ? -1 : interview.getRoomSize());
      room.setUiConfig(RoomUiConfig.defaultForType(interview.getType()));
      room.setAccessPolicy(interview.effectiveAccessPolicy());
      room.setExtended(Boolean.TRUE.equals(interview.getExtended()));
      room.setEndsAt(interview.getEndTime());
      room.setCreatedAt(Instant.now());
      return room;
    });
  }

  /** First entry: the interview is now in progress and its clock starts. */
  private void goLive(ActiveRoom room, Interview interview) {
    Instant now = Instant.now();
    if (interview.getLiveSince() == null) {
      interview.setLiveSince(now);
      int minutes = interview.getDurationMinutes() == null ? 60 : interview.getDurationMinutes();
      Instant start = interview.getStartTime() == null || interview.getStartTime().isBefore(now) ? now : interview.getStartTime();
      interview.setEndTime(start.plus(Duration.ofMinutes(minutes)));
    }
    interview.setStatus(InterviewStatus.STARTED);
    interviewRepository.save(interview);
    room.setEndsAt(interview.getEndTime());
    room.setLive(true);
  }

  private ActiveRoom liveRoom(String rawCode) {
    ActiveRoom room = rooms.get(RoomUtil.canonical(rawCode));
    if (room == null || !room.isLive()) throw ApiException.notFound("This interview isn't in progress");
    return room;
  }

  private RoomParticipant requireActive(ActiveRoom room, UUID userId) {
    RoomParticipant p = room.getParticipants().get(userId);
    if (p == null || !p.isActive() || room.getBlocked().contains(userId)) {
      throw ApiException.forbidden("NOT_A_MEMBER", "You're not in this interview");
    }
    return p;
  }

  private void requireStaff(ActiveRoom room, UUID userId) {
    requireActive(room, userId);
    if (!room.isStaff(userId)) throw ApiException.forbidden("NOT_STAFF", "Only the host or an interviewer can do that");
  }

  private void requireHost(ActiveRoom room, UUID userId) {
    if (!userId.equals(room.getHostId()) && !userId.equals(room.getOwnerId())) {
      throw ApiException.forbidden("NOT_HOST", "Only the host can do that");
    }
  }

  private boolean isFull(ActiveRoom room) {
    return room.getMaxParticipants() > 0 && room.activeCount() >= room.getMaxParticipants();
  }

  private static boolean isEnded(Interview interview) {
    return interview.getStatus() == InterviewStatus.COMPLETED || interview.getStatus() == InterviewStatus.GHOSTED;
  }

  /** Host rights: the owner while present; otherwise an interviewer, then anyone, by arrival. */
  private void handOffHostIfNeeded(ActiveRoom room) {
    RoomParticipant owner = room.getParticipants().get(room.getOwnerId());
    if (owner != null && owner.isActive()) {
      room.setHostId(owner.getUserId());
      return;
    }
    RoomParticipant host = room.getHostId() == null ? null : room.getParticipants().get(room.getHostId());
    if (host != null && host.isActive()) return;
    room.setHostId(
        room.getParticipants().values().stream()
            .filter(RoomParticipant::isActive)
            .sorted(Comparator.comparing((RoomParticipant p) -> p.getRole() == InterviewRole.INTERVIEWER ? 0 : 1)
                .thenComparing(RoomParticipant::getJoinedAt))
            .map(RoomParticipant::getUserId)
            .findFirst()
            .orElse(null));
  }

  /** Role changed: update history, and make the user's clients reconnect with a new ticket. */
  private void permissionsChanged(ActiveRoom room, RoomParticipant p) {
    userInterviewRepository.findById(new UserInterviewId(p.getUserId(), room.getInterviewId())).ifPresent(ui -> {
      ui.setRole(p.getRole());
      userInterviewRepository.save(ui);
    });
    toUser(p.getUserId(), "/queue/session", Map.of("type", "PERMISSIONS", "room", room.getCode(), "role", p.getRole().name()));
    // Drop document/whiteboard connections so they reconnect with the new role (private notes, read-only).
    collaboration.revokeUser(room.getCode(), p.getUserId(), null, true);
  }

  private void recordParticipation(Interview interview, UUID userId, InterviewRole role) {
    UserInterviewId id = new UserInterviewId(userId, interview.getId());
    if (userInterviewRepository.existsById(id)) return;
    UserInterview participation = new UserInterview();
    participation.setId(id);
    participation.setUser(userRepository.getReferenceById(userId));
    participation.setInterview(interview);
    participation.setRole(role);
    userInterviewRepository.save(participation);
  }

  private Optional<InterviewInvite> activeInvite(Long interviewId, String email) {
    return inviteRepository.findByInterviewIdAndEmailIgnoreCase(interviewId, email)
        .filter(invite -> invite.getStatus() == InviteStatus.PENDING || invite.getStatus() == InviteStatus.ACCEPTED);
  }

  private static AccessRequest findRequest(ActiveRoom room, UUID userId, AccessRequest.Status status) {
    return room.getRequests().values().stream()
        .filter(r -> r.getUserId().equals(userId) && r.getStatus() == status)
        .max(Comparator.comparing(AccessRequest::getRequestedAt))
        .orElse(null);
  }

  private static InterviewRole ownerRole(Interview interview) {
    InterviewRole role = interview.getOwnerRole();
    return role == null || role == InterviewRole.BOTH ? InterviewRole.INTERVIEWER : role;
  }

  private static String codeOf(Interview interview) {
    return RoomUtil.canonical(interview.getRoomId());
  }

  private User user(UUID userId) {
    return userRepository.findById(userId).orElseThrow(() -> ApiException.notFound("User not found"));
  }

  private String nameOf(ActiveRoom room, UUID userId) {
    RoomParticipant p = room.getParticipants().get(userId);
    return p != null ? p.getName() : userRepository.findById(userId).map(User::getName).orElse("Someone");
  }

  private ApiException accessError(String access) {
    return switch (access) {
      case "ENDED", "CANCELLED" -> ApiException.gone(access, "This interview has ended");
      case "NOT_STARTED" -> ApiException.forbidden(access, "This interview hasn't started yet");
      case "FULL" -> ApiException.forbidden("ROOM_FULL", "The room is full");
      case "REMOVED" -> ApiException.forbidden(access, "You were removed from this interview");
      case "DENIED" -> ApiException.forbidden(access, "Your request to join was declined");
      case "NOT_INVITED" -> ApiException.forbidden(access, "Only invited people can join this interview");
      case "PENDING" -> ApiException.forbidden(access, "Waiting for someone to let you in");
      default -> ApiException.forbidden("MUST_ASK", "Ask to join and wait for someone to let you in");
    };
  }

  private String ticket(ActiveRoom room, RoomParticipant p, boolean readonly, long ttl) {
    JoinResultDto.MeDto me = me(room, p);
    return ticketService.issue(p.getUserId(), room.getCode(), p.getRole().name(), p.getName(), me.staff(), me.host(), readonly || me.readonly(), ttl);
  }

  private JoinResultDto.MeDto me(ActiveRoom room, RoomParticipant p) {
    boolean host = p.getUserId().equals(room.getHostId()) || p.getUserId().equals(room.getOwnerId());
    return new JoinResultDto.MeDto(p.getRole().name(), host, host || p.getRole() == InterviewRole.INTERVIEWER, p.getRole() == InterviewRole.OBSERVER);
  }

  private RoomStateDto state(ActiveRoom room) {
    List<ParticipantDto> participants =
        room.getParticipants().values().stream()
            .filter(p -> !room.getBlocked().contains(p.getUserId()))
            .sorted(Comparator.comparing(RoomParticipant::getJoinedAt))
            .map(p -> new ParticipantDto(
                p.getUserId(),
                p.getName(),
                p.getUsername(),
                p.getAvatarThumbUrl(),
                p.getRole().name(),
                p.getStatus().name(),
                p.getUserId().equals(room.getHostId()),
                p.getUserId().equals(room.getOwnerId()),
                p.getJoinedAt()))
            .toList();
    return new RoomStateDto(
        room.getCode(),
        RoomUtil.format(room.getCode()),
        room.getInterviewId(),
        room.getTitle(),
        room.getType() == null ? null : room.getType().name(),
        room.getUiConfig(),
        room.getOwnerId(),
        room.getHostId(),
        room.getAccessPolicy().name(),
        room.getEndsAt(),
        room.isExtended(),
        room.getMaxParticipants(),
        participants);
  }

  private void broadcastState(ActiveRoom room) {
    if (room.isLive()) messaging.convertAndSend(topic(room, "state"), state(room));
  }

  /** Sends to every connected host/interviewer; false when none is connected. */
  private boolean notifyStaff(ActiveRoom room, Map<String, Object> payload) {
    boolean any = false;
    for (RoomParticipant p : room.getParticipants().values()) {
      if (p.getStatus() == RoomParticipantStatus.CONNECTED && room.isStaff(p.getUserId())) {
        toUser(p.getUserId(), "/queue/lobby", payload);
        any = true;
      }
    }
    return any;
  }

  private void notifyOwnerOfWaitingGuest(ActiveRoom room, String guestName) {
    try {
      User owner = user(room.getOwnerId());
      notifications.dispatch(
          new JoinRequestNotification(owner.getId(), owner.getEmail(), guestName, frontendUrl + "/" + RoomUtil.format(room.getCode())),
          NotificationType.JOIN_REQUEST);
    } catch (Exception e) {
      log.warn("[Room {}] Could not notify the owner about a waiting guest: {}", room.getCode(), e.getMessage());
    }
  }

  private void toUser(UUID userId, String destination, Map<String, ?> payload) {
    messaging.convertAndSendToUser(userId.toString(), destination, payload);
  }

  private static String topic(ActiveRoom room, String name) {
    return "/topic/room/" + room.getCode() + "/" + name;
  }

  private AccessRequestDto dto(AccessRequest r) {
    return new AccessRequestDto(r.getId(), r.getUserId(), r.getName(), r.getEmail(), r.getRequestedAt(), r.getStatus().name());
  }

  private ChatMessageDto dto(InterviewMessage m) {
    return new ChatMessageDto(m.getId(), m.getSenderId(), m.getSenderName(), m.getText(), m.getSentAt());
  }

  /** For tests and diagnostics. */
  Map<String, Object> debugSnapshot() {
    Map<String, Object> out = new LinkedHashMap<>();
    rooms.forEach((code, room) -> out.put(code, state(room)));
    return out;
  }
}
