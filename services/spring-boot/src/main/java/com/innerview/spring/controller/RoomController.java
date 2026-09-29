package com.innerview.spring.controller;

import com.innerview.spring.dto.SfuAccessTokenDto;
import com.innerview.spring.dto.room.AccessInfoDto;
import com.innerview.spring.dto.room.AccessRequestDto;
import com.innerview.spring.dto.room.ChatMessageDto;
import com.innerview.spring.dto.room.JoinResultDto;
import com.innerview.spring.dto.room.RoomStateDto;
import com.innerview.spring.dto.room.TicketDto;
import com.innerview.spring.enums.AccessPolicy;
import com.innerview.spring.enums.InterviewRole;
import com.innerview.spring.exception.ApiException;
import com.innerview.spring.service.RoomService;
import com.innerview.spring.service.SfuService;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Interview rooms by code (any case, dashes optional): pre-join access check, joining, the lobby,
 * participant management and ending. Real-time traffic goes over STOMP with a room ticket.
 */
@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

  private final RoomService roomService;
  private final SfuService sfuService;

  // ── entering ──────────────────────────────────────────────────────────────

  @GetMapping("/{code}/access")
  public ResponseEntity<AccessInfoDto> access(@PathVariable String code, @AuthenticationPrincipal UUID userId) {
    return ResponseEntity.ok(roomService.getAccess(code, userId));
  }

  @PostMapping("/{code}/join")
  public ResponseEntity<JoinResultDto> join(@PathVariable String code, @AuthenticationPrincipal UUID userId) {
    return ResponseEntity.ok(roomService.join(code, userId));
  }

  @PostMapping("/{code}/ticket")
  public ResponseEntity<TicketDto> ticket(@PathVariable String code, @AuthenticationPrincipal UUID userId) {
    return ResponseEntity.ok(roomService.issueTicket(code, userId));
  }

  @PostMapping("/{code}/knock")
  public ResponseEntity<AccessRequestDto> knock(@PathVariable String code, @AuthenticationPrincipal UUID userId) {
    return ResponseEntity.ok(roomService.knock(code, userId));
  }

  @DeleteMapping("/{code}/knock")
  public ResponseEntity<Void> cancelKnock(@PathVariable String code, @AuthenticationPrincipal UUID userId) {
    roomService.cancelKnock(code, userId);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/{code}/requests")
  public ResponseEntity<List<AccessRequestDto>> requests(@PathVariable String code, @AuthenticationPrincipal UUID userId) {
    return ResponseEntity.ok(roomService.pendingRequests(code, userId));
  }

  /** Body (optional): {"role": "INTERVIEWEE" | "INTERVIEWER" | "OBSERVER"}. */
  @PostMapping("/{code}/requests/{requestId}/admit")
  public ResponseEntity<Void> admit(
      @PathVariable String code,
      @PathVariable String requestId,
      @RequestBody(required = false) Map<String, String> body,
      @AuthenticationPrincipal UUID userId) {
    roomService.decide(code, requestId, userId, true, role(body == null ? null : body.get("role"), InterviewRole.INTERVIEWEE));
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/{code}/requests/{requestId}/deny")
  public ResponseEntity<Void> deny(@PathVariable String code, @PathVariable String requestId, @AuthenticationPrincipal UUID userId) {
    roomService.decide(code, requestId, userId, false, null);
    return ResponseEntity.noContent().build();
  }

  // ── in the room ───────────────────────────────────────────────────────────

  @GetMapping("/{code}/state")
  public ResponseEntity<RoomStateDto> state(@PathVariable String code, @AuthenticationPrincipal UUID userId) {
    return ResponseEntity.ok(roomService.getState(code, userId));
  }

  /** Leaves without ending the interview. Idempotent. */
  @PostMapping("/{code}/leave")
  public ResponseEntity<Void> leave(@PathVariable String code, @AuthenticationPrincipal UUID userId) {
    roomService.leave(code, userId);
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/{code}/participants/{targetId}/remove")
  public ResponseEntity<Void> remove(@PathVariable String code, @PathVariable UUID targetId, @AuthenticationPrincipal UUID userId) {
    roomService.removeParticipant(code, userId, targetId);
    return ResponseEntity.noContent().build();
  }

  /** Body: {"role": "INTERVIEWER" | "INTERVIEWEE" | "OBSERVER"}. */
  @PostMapping("/{code}/participants/{targetId}/role")
  public ResponseEntity<Void> changeRole(
      @PathVariable String code,
      @PathVariable UUID targetId,
      @RequestBody Map<String, String> body,
      @AuthenticationPrincipal UUID userId) {
    roomService.changeRole(code, userId, targetId, role(body.get("role"), null));
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/{code}/swap-roles")
  public ResponseEntity<Void> swapRoles(@PathVariable String code, @AuthenticationPrincipal UUID userId) {
    roomService.swapRoles(code, userId);
    return ResponseEntity.noContent().build();
  }

  /** Body: {"accessPolicy": "OPEN" | "ASK_TO_JOIN" | "INVITE_ONLY"}. */
  @PatchMapping("/{code}/settings")
  public ResponseEntity<Void> settings(
      @PathVariable String code, @RequestBody Map<String, String> body, @AuthenticationPrincipal UUID userId) {
    AccessPolicy policy;
    try {
      policy = AccessPolicy.valueOf(String.valueOf(body.get("accessPolicy")).toUpperCase(Locale.ROOT));
    } catch (IllegalArgumentException e) {
      throw ApiException.badRequest("INVALID_POLICY", "Unknown access policy");
    }
    roomService.setAccessPolicy(code, userId, policy);
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/{code}/extend")
  public ResponseEntity<Void> extend(@PathVariable String code, @AuthenticationPrincipal UUID userId) {
    roomService.extend(code, userId);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/{code}/chat")
  public ResponseEntity<List<ChatMessageDto>> chat(@PathVariable String code, @AuthenticationPrincipal UUID userId) {
    return ResponseEntity.ok(roomService.chatHistory(code, userId));
  }

  /** LiveKit token for the room's video call (active participants only). */
  @GetMapping("/{code}/token")
  public ResponseEntity<SfuAccessTokenDto> videoToken(@PathVariable String code, @AuthenticationPrincipal UUID userId) {
    return ResponseEntity.ok(sfuService.generateSfuAccessToken(code, roomService.requireActiveParticipant(code, userId)));
  }

  /** Ends and saves the interview for everyone (host, interviewers, or the owner from outside). */
  @PostMapping("/{code}/end")
  public ResponseEntity<Void> end(@PathVariable String code, @AuthenticationPrincipal UUID userId) {
    roomService.endInterview(code, userId);
    return ResponseEntity.noContent().build();
  }

  private static InterviewRole role(String value, InterviewRole fallback) {
    if (value == null || value.isBlank()) {
      if (fallback == null) throw ApiException.badRequest("INVALID_ROLE", "Choose a role");
      return fallback;
    }
    return switch (value.trim().toUpperCase(Locale.ROOT)) {
      case "INTERVIEWER", "CO_HOST" -> InterviewRole.INTERVIEWER;
      case "INTERVIEWEE", "CANDIDATE" -> InterviewRole.INTERVIEWEE;
      case "OBSERVER" -> InterviewRole.OBSERVER;
      default -> throw ApiException.badRequest("INVALID_ROLE", "Role must be interviewer, candidate or observer");
    };
  }
}
