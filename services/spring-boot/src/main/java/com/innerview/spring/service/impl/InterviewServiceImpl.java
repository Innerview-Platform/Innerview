package com.innerview.spring.service.impl;

import com.innerview.spring.core.util.RoomUtil;
import com.innerview.spring.dto.InstantInterviewRequest;
import com.innerview.spring.dto.InterviewResponse;
import com.innerview.spring.dto.InterviewScheduledNotification;
import com.innerview.spring.dto.InterviewSummaryDto;
import com.innerview.spring.dto.ScheduledInterviewRequest;
import com.innerview.spring.dto.room.ChatMessageDto;
import com.innerview.spring.dto.room.InterviewDetailsDto;
import com.innerview.spring.dto.room.InviteDto;
import com.innerview.spring.dto.room.InviteRequest;
import com.innerview.spring.dto.room.UpcomingInterviewDto;
import com.innerview.spring.entity.Interview;
import com.innerview.spring.entity.InterviewInvite;
import com.innerview.spring.entity.Problem;
import com.innerview.spring.entity.User;
import com.innerview.spring.entity.UserInterview;
import com.innerview.spring.entity.UserInterviewId;
import com.innerview.spring.enums.AccessPolicy;
import com.innerview.spring.enums.InterviewRole;
import com.innerview.spring.enums.InterviewStatus;
import com.innerview.spring.enums.InterviewType;
import com.innerview.spring.enums.InviteStatus;
import com.innerview.spring.enums.NotificationType;
import com.innerview.spring.enums.RoomSize;
import com.innerview.spring.exception.ApiException;
import com.innerview.spring.mapper.InterviewMapper;
import com.innerview.spring.repository.InterviewInviteRepository;
import com.innerview.spring.repository.InterviewMessageRepository;
import com.innerview.spring.repository.InterviewRepository;
import com.innerview.spring.repository.ProblemRepository;
import com.innerview.spring.repository.UserInterviewRepository;
import com.innerview.spring.repository.UserRepository;
import com.innerview.spring.service.InterviewService;
import com.innerview.spring.service.NotificationPublisherService;
import com.innerview.spring.service.RoomService;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@RequiredArgsConstructor
@Service
public class InterviewServiceImpl implements InterviewService {

  private static final Set<InterviewStatus> NOT_ENDED = EnumSet.of(InterviewStatus.SCHEDULED, InterviewStatus.STARTED);
  private static final DateTimeFormatter ICS_TIME =
      DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'").withZone(ZoneOffset.UTC);

  private final InterviewRepository interviewRepository;
  private final InterviewMapper interviewMapper;
  private final NotificationPublisherService notificationPublisherService;
  private final ProblemRepository problemRepository;
  private final UserRepository userRepository;
  private final UserInterviewRepository userInterviewRepository;
  private final InterviewInviteRepository inviteRepository;
  private final InterviewMessageRepository messageRepository;
  private final AvatarLookup avatarLookup;
  private final InviteService inviteService;
  private final RoomService roomService;

  @Value("${frontend.url}")
  private String frontendUrl;

  @Value("${interview.duration}")
  private Integer interviewDuration;

  @Override
  public List<InterviewSummaryDto> getInterviewHistory(UUID userId) {
    return interviewRepository.findCompletedInterviewsByUserIdNative(userId).stream()
        .map(interviewMapper::toSummaryDto)
        .collect(Collectors.toList());
  }

  @Override
  public InterviewResponse createInstantInterview(InstantInterviewRequest request, UUID userId) {
    Interview interview =
        newInterview(
            request.getInterviewType(),
            request.getRoomSize(),
            request.getCreatorInterviewRole(),
            request.getTitle(),
            request.getAccessPolicy(),
            Instant.now(),
            request.getProblemIds(),
            userId);
    Interview saved = interviewRepository.save(interview);
    inviteService.invite(saved, request.getInvitees(), userId);
    return response(saved);
  }

  @Override
  public InterviewResponse createScheduledInterview(ScheduledInterviewRequest request, UUID userId) {
    if (request.getStartTime() == null || request.getStartTime().isBefore(Instant.now().minus(Duration.ofMinutes(1)))) {
      throw ApiException.badRequest("INVALID_START", "Choose a start time in the future");
    }
    Interview interview =
        newInterview(
            request.getInterviewType(),
            request.getRoomSize(),
            request.getCreatorInterviewRole(),
            request.getTitle(),
            request.getAccessPolicy(),
            request.getStartTime(),
            request.getProblemIds(),
            userId);
    Interview saved = interviewRepository.save(interview);
    inviteService.invite(saved, request.getInvitees(), userId);
    sendScheduleNotification(saved, request.getRoomSize());
    return response(saved);
  }

  /**
   * Interviews start SCHEDULED (instant ones with start time = now) and become STARTED when the
   * first person enters; the clock starts then (RoomServiceImpl.goLive).
   */
  private Interview newInterview(
      InterviewType type,
      RoomSize roomSize,
      InterviewRole ownerRole,
      String title,
      AccessPolicy policy,
      Instant startTime,
      List<UUID> problemIds,
      UUID ownerId) {
    if (type == null) throw ApiException.badRequest("INVALID_TYPE", "Choose an interview type");
    Interview interview = new Interview();
    interview.setType(type);
    interview.setOwnerId(ownerId);
    interview.setOwnerRole(ownerRole == null || ownerRole == InterviewRole.BOTH ? InterviewRole.INTERVIEWER : ownerRole);
    interview.setTitle(title == null || title.isBlank() ? null : title.strip());
    interview.setAccessPolicy(policy == null ? AccessPolicy.ASK_TO_JOIN : policy);
    interview.setRoomId(RoomUtil.generateUniqueRoomId(code -> interviewRepository.findByRoomId(code).isPresent()));
    interview.setStatus(InterviewStatus.SCHEDULED);
    interview.setStartTime(startTime);
    interview.setDurationMinutes(interviewDuration);
    interview.setEndTime(startTime.plus(Duration.ofMinutes(interviewDuration)));
    interview.setRoomSize(roomSize == RoomSize.ONE_ON_ONE ? 2 : -1);
    interview.setProblems(resolveProblems(problemIds));
    return interview;
  }

  private InterviewResponse response(Interview interview) {
    InterviewResponse response = new InterviewResponse();
    response.setInterviewId(interview.getId());
    response.setRoomId(interview.getRoomId());
    response.setDisplayCode(RoomUtil.format(interview.getRoomId()));
    response.setRoomLink(roomLink(interview));
    return response;
  }

  private String roomLink(Interview interview) {
    return frontendUrl + "/" + RoomUtil.format(RoomUtil.canonical(interview.getRoomId()));
  }

  private void sendScheduleNotification(Interview interview, RoomSize roomSize) {
    Optional<User> owner = userRepository.findById(interview.getOwnerId());
    if (owner.isEmpty()) return;
    User user = owner.get();
    try {
      notificationPublisherService.dispatch(
          new InterviewScheduledNotification(
              user.getId().toString(),
              user.getEmail(),
              user.getName(),
              interview.getType(),
              roomSize,
              interview.getStartTime(),
              interview.getDurationMinutes(),
              roomLink(interview)),
          NotificationType.INTERVIEW_SCHEDULED,
          interview.getId(),
          interview.getStartTime(),
          interview.getEndTime(),
          interview.getDurationMinutes(),
          user.getName(),
          user.getEmail());
    } catch (Exception e) {
      log.warn("Could not send the schedule notification for interview {}: {}", interview.getId(), e.getMessage());
    }
  }

  private List<Problem> resolveProblems(List<UUID> problemIds) {
    if (problemIds == null || problemIds.isEmpty()) return new ArrayList<>();
    return new ArrayList<>(problemRepository.findAllById(problemIds).stream().filter(Problem::isActive).toList());
  }

  @Override
  public List<InterviewSummaryDto> getCreatedInterview(UUID userId) {
    return interviewRepository.findByOwnerIdOrderByCreatedAtDesc(userId).stream()
        .map(interviewMapper::toSummaryDto)
        .collect(Collectors.toList());
  }

  @Override
  public void cancelInterview(Long interviewId, UUID currentUserId) {
    Interview interview = interview(interviewId);
    if (!interview.getOwnerId().equals(currentUserId)) throw ApiException.forbidden("NOT_OWNER", "Only the owner can cancel this interview");
    if (interview.getStatus() != InterviewStatus.SCHEDULED || interview.getLiveSince() != null) {
      throw ApiException.conflict("NOT_CANCELLABLE", "Only interviews that haven't started can be cancelled");
    }
    interview.setStatus(InterviewStatus.CANCELLED);
    interviewRepository.save(interview);
  }

  @Override
  public void completeInterview(Long interviewId, UUID currentUserId) {
    roomService.endInterview(interview(interviewId).getRoomId(), currentUserId);
  }

  @Override
  public List<UpcomingInterviewDto> getUpcoming(UUID userId) {
    User user = userRepository.findById(userId).orElseThrow();
    Map<Long, UpcomingInterviewDto> result = new LinkedHashMap<>();

    for (Interview interview : interviewRepository.findByOwnerIdOrderByCreatedAtDesc(userId)) {
      if (NOT_ENDED.contains(interview.getStatus())) {
        result.put(interview.getId(), upcoming(interview, roleOfOwner(interview), true));
      }
    }
    for (InterviewInvite invite : inviteRepository.findByEmailIgnoreCaseAndStatusNot(user.getEmail(), InviteStatus.REVOKED)) {
      if (invite.getStatus() == InviteStatus.DECLINED || result.containsKey(invite.getInterviewId())) continue;
      interviewRepository.findById(invite.getInterviewId())
          .filter(interview -> NOT_ENDED.contains(interview.getStatus()))
          .ifPresent(interview -> result.put(interview.getId(), upcoming(interview, invite.getRole(), false)));
    }
    return result.values().stream()
        .sorted(Comparator.comparing(UpcomingInterviewDto::live).reversed()
            .thenComparing(UpcomingInterviewDto::startTime, Comparator.nullsLast(Comparator.naturalOrder())))
        .toList();
  }

  private UpcomingInterviewDto upcoming(Interview interview, InterviewRole role, boolean owner) {
    String code = RoomUtil.canonical(interview.getRoomId());
    String hostName = userRepository.findById(interview.getOwnerId()).map(User::getName).orElse(null);
    return new UpcomingInterviewDto(
        interview.getId(),
        code,
        RoomUtil.format(code),
        interview.getTitle(),
        interview.getType() == null ? null : interview.getType().name(),
        interview.getStatus().name(),
        interview.getStartTime(),
        interview.getEndTime(),
        role.name(),
        owner,
        hostName,
        roomService.isLive(code));
  }

  @Override
  public InterviewDetailsDto getDetails(Long interviewId, UUID userId) {
    Interview interview = interview(interviewId);
    User user = userRepository.findById(userId).orElseThrow();
    boolean owner = interview.getOwnerId().equals(userId);
    Optional<UserInterview> participation = userInterviewRepository.findById(new UserInterviewId(userId, interviewId));
    Optional<InterviewInvite> invite = inviteRepository.findByInterviewIdAndEmailIgnoreCase(interviewId, user.getEmail())
        .filter(i -> i.getStatus() != InviteStatus.REVOKED);
    if (!owner && participation.isEmpty() && invite.isEmpty()) {
      throw ApiException.forbidden("NOT_A_PARTICIPANT", "You didn't take part in this interview");
    }
    InterviewRole myRole = participation.map(UserInterview::getRole)
        .orElseGet(() -> owner ? roleOfOwner(interview) : invite.get().getRole());
    boolean staff = owner || myRole == InterviewRole.INTERVIEWER;
    boolean ended = interview.getStatus() == InterviewStatus.COMPLETED;

    List<UserInterview> participations = userInterviewRepository.findByIdInterviewId(interviewId);
    Map<UUID, String> avatars = avatarLookup.thumbnails(participations.stream().map(ui -> ui.getId().getUserId()).toList());
    List<InterviewDetailsDto.Person> people = participations.stream()
        .map(ui -> new InterviewDetailsDto.Person(
            ui.getId().getUserId(), ui.getUser().getName(), ui.getUser().getUsername(),
            avatars.get(ui.getId().getUserId()), ui.getRole().name()))
        .toList();
    List<ChatMessageDto> chat = ended && participation.isPresent() || ended && owner
        ? messageRepository.findByInterviewIdOrderBySentAtAsc(interviewId).stream()
            .map(m -> new ChatMessageDto(m.getId(), m.getSenderId(), m.getSenderName(), m.getText(), m.getSentAt()))
            .toList()
        : List.of();
    List<InviteDto> invites = owner
        ? inviteRepository.findByInterviewIdAndStatusNot(interviewId, InviteStatus.REVOKED).stream().map(InviteService::dto).toList()
        : List.of();
    String code = RoomUtil.canonical(interview.getRoomId());

    return new InterviewDetailsDto(
        interview.getId(),
        code,
        RoomUtil.format(code),
        interview.getTitle(),
        interview.getType() == null ? null : interview.getType().name(),
        interview.getStatus().name(),
        interview.getStartTime(),
        interview.getEndTime(),
        interview.getLiveSince(),
        interview.getDurationMinutes(),
        interview.getOwnerId(),
        userRepository.findById(interview.getOwnerId()).map(User::getName).orElse(null),
        interview.effectiveAccessPolicy().name(),
        myRole.name(),
        owner,
        staff,
        people,
        ended ? interview.getSharedCode() : null,
        ended ? interview.getProblemNotes() : null,
        ended && staff ? interview.getInterviewerNotes() : null,
        chat,
        invites);
  }

  @Override
  public String calendarFile(Long interviewId, UUID userId) {
    InterviewDetailsDto details = getDetails(interviewId, userId);
    Instant start = details.startTime() == null ? Instant.now() : details.startTime();
    Instant end = details.endTime() == null ? start.plus(Duration.ofMinutes(60)) : details.endTime();
    String link = frontendUrl + "/" + details.displayCode();
    String summary = details.title() == null ? "Mock interview (InnerView)" : details.title() + " (InnerView)";
    return String.join(
        "\r\n",
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//InnerView//Interviews//EN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        "UID:interview-" + details.id() + "@innerview",
        "DTSTAMP:" + ICS_TIME.format(Instant.now()),
        "DTSTART:" + ICS_TIME.format(start),
        "DTEND:" + ICS_TIME.format(end),
        "SUMMARY:" + escapeIcs(summary),
        "DESCRIPTION:" + escapeIcs("Join: " + link),
        "URL:" + link,
        "LOCATION:" + link,
        "BEGIN:VALARM",
        "TRIGGER:-PT10M",
        "ACTION:DISPLAY",
        "DESCRIPTION:Interview starts in 10 minutes",
        "END:VALARM",
        "END:VEVENT",
        "END:VCALENDAR",
        "");
  }

  private static String escapeIcs(String value) {
    return value.replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace("\n", "\\n");
  }

  private static InterviewRole roleOfOwner(Interview interview) {
    return interview.getOwnerRole() == null ? InterviewRole.INTERVIEWER : interview.getOwnerRole();
  }

  private Interview interview(Long id) {
    return interviewRepository.findById(id).orElseThrow(() -> ApiException.notFound("Interview not found"));
  }
}
