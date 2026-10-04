package com.innerview.spring.controller;

import com.innerview.spring.core.util.RoomTicketService;
import com.innerview.spring.core.util.RoomUtil;
import com.innerview.spring.enums.InterviewStatus;
import com.innerview.spring.exception.ApiException;
import com.innerview.spring.repository.InterviewRepository;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Service-to-service endpoints (not for browsers). Authenticated with the internal token derived
 * from JWT_SECRET (header {@code X-Internal-Token}), see RoomTicketService.
 */
@RestController
@RequestMapping("/api/internal")
@RequiredArgsConstructor
public class InternalController {

  private final RoomTicketService ticketService;
  private final InterviewRepository interviewRepository;

  /**
   * Hocuspocus stores a room document: keep its text on the interview row too, so it survives
   * even if the editor server's data is lost. Body: {"room", "document": code|notes|private, "text"}.
   */
  @PostMapping("/documents")
  public ResponseEntity<Void> saveDocument(
      @RequestHeader(value = "X-Internal-Token", required = false) String token, @RequestBody Map<String, String> body) {
    if (!ticketService.isInternalToken(token)) throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Invalid internal token");
    String room = RoomUtil.canonical(body.get("room"));
    String text = body.getOrDefault("text", "");
    interviewRepository.findByRoomId(room)
        .filter(interview -> interview.getStatus() == InterviewStatus.STARTED)
        .ifPresent(interview -> {
          switch (String.valueOf(body.get("document"))) {
            case "code" -> interview.setSharedCode(text);
            case "notes" -> interview.setProblemNotes(text);
            case "private" -> interview.setInterviewerNotes(text);
            default -> throw ApiException.badRequest("INVALID_DOCUMENT", "Unknown document");
          }
          interviewRepository.save(interview);
        });
    return ResponseEntity.noContent().build();
  }
}
