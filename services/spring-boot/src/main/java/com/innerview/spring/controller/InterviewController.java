package com.innerview.spring.controller;

import com.innerview.spring.dto.InstantInterviewRequest;
import com.innerview.spring.dto.InterviewResponse;
import com.innerview.spring.dto.InterviewSummaryDto;
import com.innerview.spring.dto.ScheduledInterviewRequest;
import com.innerview.spring.dto.feedback.FeedbackFormDto;
import com.innerview.spring.dto.feedback.FeedbackViewDto;
import com.innerview.spring.dto.feedback.SubmitFeedbackRequest;
import com.innerview.spring.dto.room.InterviewDetailsDto;
import com.innerview.spring.dto.room.InviteDto;
import com.innerview.spring.dto.room.InviteRequest;
import com.innerview.spring.dto.room.TicketDto;
import com.innerview.spring.dto.room.UpcomingInterviewDto;
import com.innerview.spring.service.InterviewService;
import com.innerview.spring.service.RoomService;
import com.innerview.spring.service.impl.FeedbackService;
import com.innerview.spring.service.impl.InviteService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/interviews")
@RequiredArgsConstructor
public class InterviewController {

  private final InterviewService interviewService;
  private final InviteService inviteService;
  private final FeedbackService feedbackService;
  private final RoomService roomService;

  @GetMapping("/user/{userId}/history")
  public ResponseEntity<List<InterviewSummaryDto>> getUserInterviewHistory(@PathVariable UUID userId) {
    return ResponseEntity.ok(interviewService.getInterviewHistory(userId));
  }

  @GetMapping("/user/createdInterviews")
  public ResponseEntity<List<InterviewSummaryDto>> getUserCreatedInterviews(@AuthenticationPrincipal UUID currentUserId) {
    return ResponseEntity.ok(interviewService.getCreatedInterview(currentUserId));
  }

  /** Interviews you host or are invited to that haven't ended (live ones first). */
  @GetMapping("/upcoming")
  public ResponseEntity<List<UpcomingInterviewDto>> getUpcoming(@AuthenticationPrincipal UUID currentUserId) {
    return ResponseEntity.ok(interviewService.getUpcoming(currentUserId));
  }

  @PostMapping("/instant")
  public ResponseEntity<InterviewResponse> createInstantInterview(
      @RequestBody InstantInterviewRequest request, @AuthenticationPrincipal UUID currentUserId) {
    return ResponseEntity.ok(interviewService.createInstantInterview(request, currentUserId));
  }

  @PostMapping("/scheduled")
  public ResponseEntity<InterviewResponse> createScheduledInterview(
      @RequestBody ScheduledInterviewRequest request, @AuthenticationPrincipal UUID currentUserId) {
    return ResponseEntity.ok(interviewService.createScheduledInterview(request, currentUserId));
  }

  /** Summary: saved code, notes, chat and participants (participants and invitees only). */
  @GetMapping("/{interviewId}")
  public ResponseEntity<InterviewDetailsDto> getDetails(@PathVariable Long interviewId, @AuthenticationPrincipal UUID currentUserId) {
    return ResponseEntity.ok(interviewService.getDetails(interviewId, currentUserId));
  }

  @GetMapping(value = "/{interviewId}/calendar.ics", produces = "text/calendar")
  public ResponseEntity<String> calendar(@PathVariable Long interviewId, @AuthenticationPrincipal UUID currentUserId) {
    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType("text/calendar; charset=utf-8"))
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"interview-" + interviewId + ".ics\"")
        .body(interviewService.calendarFile(interviewId, currentUserId));
  }

  @PatchMapping("/{interviewId}/cancel")
  public ResponseEntity<Void> cancelInterview(@PathVariable Long interviewId, @AuthenticationPrincipal UUID currentUserId) {
    interviewService.cancelInterview(interviewId, currentUserId);
    return ResponseEntity.noContent().build();
  }

  @PatchMapping("/{interviewId}/complete")
  public ResponseEntity<Void> completeInterview(@PathVariable Long interviewId, @AuthenticationPrincipal UUID currentUserId) {
    interviewService.completeInterview(interviewId, currentUserId);
    return ResponseEntity.noContent().build();
  }

  // ── invites ──────────────────────────────────────────────────────────────

  @GetMapping("/{interviewId}/invites")
  public ResponseEntity<List<InviteDto>> listInvites(@PathVariable Long interviewId, @AuthenticationPrincipal UUID currentUserId) {
    return ResponseEntity.ok(inviteService.list(interviewId, currentUserId));
  }

  @PostMapping("/{interviewId}/invites")
  public ResponseEntity<List<InviteDto>> invite(
      @PathVariable Long interviewId, @Valid @RequestBody InviteRequest request, @AuthenticationPrincipal UUID currentUserId) {
    return ResponseEntity.ok(inviteService.invite(interviewId, request.invitees(), currentUserId));
  }

  @DeleteMapping("/{interviewId}/invites/{inviteId}")
  public ResponseEntity<Void> revokeInvite(
      @PathVariable Long interviewId, @PathVariable Long inviteId, @AuthenticationPrincipal UUID currentUserId) {
    inviteService.revoke(interviewId, inviteId, currentUserId);
    return ResponseEntity.noContent().build();
  }

  // ── after the interview ─────────────────────────────────────────────────

  @GetMapping("/{interviewId}/feedback")
  public ResponseEntity<FeedbackFormDto> feedbackForm(@PathVariable Long interviewId, @AuthenticationPrincipal UUID currentUserId) {
    return ResponseEntity.ok(feedbackService.getForm(interviewId, currentUserId));
  }

  @PostMapping("/{interviewId}/feedback")
  public ResponseEntity<FeedbackViewDto> submitFeedback(
      @PathVariable Long interviewId, @Valid @RequestBody SubmitFeedbackRequest request, @AuthenticationPrincipal UUID currentUserId) {
    return ResponseEntity.ok(feedbackService.submit(interviewId, currentUserId, request));
  }

  /** Read-only ticket for the summary page: saved documents, whiteboard and replay. */
  @PostMapping("/{interviewId}/review-ticket")
  public ResponseEntity<TicketDto> reviewTicket(@PathVariable Long interviewId, @AuthenticationPrincipal UUID currentUserId) {
    return ResponseEntity.ok(roomService.issueReviewTicket(interviewId, currentUserId));
  }
}
