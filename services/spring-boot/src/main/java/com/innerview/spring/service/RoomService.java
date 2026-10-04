package com.innerview.spring.service;

import com.innerview.spring.core.config.StompPrincipal;
import com.innerview.spring.dto.room.AccessInfoDto;
import com.innerview.spring.dto.room.AccessRequestDto;
import com.innerview.spring.dto.room.ChatMessageDto;
import com.innerview.spring.dto.room.JoinResultDto;
import com.innerview.spring.dto.room.RoomStateDto;
import com.innerview.spring.dto.room.TicketDto;
import com.innerview.spring.entity.Interview;
import com.innerview.spring.entity.RoomParticipant;
import com.innerview.spring.enums.AccessPolicy;
import com.innerview.spring.enums.InterviewEndReason;
import com.innerview.spring.enums.InterviewRole;
import java.util.List;
import java.util.UUID;

/**
 * Interview rooms: who may enter (invites, lobby, admission), presence, roles and host rights, the
 * timer, chat, and ending. All room codes are accepted in any case, with or without dashes.
 */
public interface RoomService {

  // ── entering ──────────────────────────────────────────────────────────────

  /** What the pre-join screen shows: the interview and this user's access (see AccessInfoDto). */
  AccessInfoDto getAccess(String code, UUID userId);

  /** Enters the room when the user may join directly; returns a room ticket and the room state. */
  JoinResultDto join(String code, UUID userId);

  /** A fresh room ticket for a member (tickets are short-lived; clients renew them on reconnect). */
  TicketDto issueTicket(String code, UUID userId);

  /** Read-only ticket for an ended interview's summary (documents, whiteboard, replay). */
  TicketDto issueReviewTicket(Long interviewId, UUID userId);

  /** "Ask to join": creates a lobby request and notifies the host/interviewers. */
  AccessRequestDto knock(String code, UUID userId);

  void cancelKnock(String code, UUID userId);

  /** Pending lobby requests (host/interviewers only). */
  List<AccessRequestDto> pendingRequests(String code, UUID actorId);

  /** Admit (with a role) or deny a lobby request (host/interviewers only). */
  void decide(String code, String requestId, UUID actorId, boolean admit, InterviewRole role);

  // ── in the room ───────────────────────────────────────────────────────────

  RoomStateDto getState(String code, UUID userId);

  /** The user if they're in the room right now; 403 otherwise. */
  RoomParticipant requireActiveParticipant(String code, UUID userId);

  /** Leaves without ending (idempotent). Host rights pass on if the host leaves. */
  void leave(String code, UUID userId);

  /** Host/interviewers: removes someone; they can't rejoin. */
  void removeParticipant(String code, UUID actorId, UUID targetId);

  /**
   * Someone's invite was revoked (the caller checked permission): while the room is live they're
   * blocked from it, and removed if they're inside. Nothing to do when it isn't live.
   */
  void removeRevokedInvitee(String code, UUID actorId, UUID targetId);

  /** Host: sets someone's role (INTERVIEWER = co-host, INTERVIEWEE, OBSERVER). */
  void changeRole(String code, UUID actorId, UUID targetId, InterviewRole role);

  /** Host: interviewer ⇄ candidate, for peer practice. */
  void swapRoles(String code, UUID actorId);

  void setAccessPolicy(String code, UUID actorId, AccessPolicy policy);

  /** Host: adds 15 minutes, once. */
  void extend(String code, UUID actorId);

  ChatMessageDto sendChat(String code, UUID userId, String text);

  List<ChatMessageDto> chatHistory(String code, UUID userId);

  // ── ending ────────────────────────────────────────────────────────────────

  /** Host/interviewer (or the owner from outside the room) ends the interview for everyone. */
  void endInterview(String code, UUID actorId);

  /** The single end path: saves documents, updates status, closes the room and all connections. */
  void endInterview(Interview interview, InterviewEndReason reason);

  boolean isLive(String code);

  // ── presence (called by the STOMP layer) ──────────────────────────────────

  /** Validates a CONNECT's room ticket and registers the socket session. */
  StompPrincipal connect(String ticket, String sessionId, String clientId, boolean takeover);

  void disconnect(String sessionId);

  /** Periodic housekeeping: reconnect grace, host hand-off, timer, empty rooms, lobby expiry. */
  void tick();
}
