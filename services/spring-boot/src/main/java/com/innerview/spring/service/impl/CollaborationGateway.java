package com.innerview.spring.service.impl;

import com.innerview.spring.core.util.RoomTicketService;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * Talks to the internal APIs of the collaboration services: the Hocuspocus editor server (code,
 * problem notes, private interviewer notes) and the tldraw whiteboard server. Calls are best-effort:
 * a failure is logged and never blocks the interview flow.
 */
@Slf4j
@Component
public class CollaborationGateway {

  private static final String INTERNAL_HEADER = "X-Internal-Token";

  private final RestClient editor;
  private final RestClient canvas;
  private final RoomTicketService ticketService;

  public CollaborationGateway(
      @Value("${collaboration.editor-url:http://localhost:1234}") String editorUrl,
      @Value("${collaboration.canvas-url:http://localhost:5858}") String canvasUrl,
      RoomTicketService ticketService) {
    this.ticketService = ticketService;
    SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
    factory.setConnectTimeout(2_000);
    factory.setReadTimeout(5_000);
    this.editor = RestClient.builder().requestFactory(factory).baseUrl(editorUrl).build();
    this.canvas = RestClient.builder().requestFactory(factory).baseUrl(canvasUrl).build();
  }

  /** Current text of the room's shared documents ("code", "notes", "private"); empty map on failure. */
  public Map<String, String> flushDocuments(String room) {
    try {
      Map<String, String> texts =
          editor
              .post()
              .uri("/internal/rooms/{room}/flush", room)
              .header(INTERNAL_HEADER, ticketService.internalToken())
              .retrieve()
              .body(new ParameterizedTypeReference<>() {});
      return texts == null ? Map.of() : texts;
    } catch (Exception e) {
      log.warn("[Collab] Could not flush documents of room {}: {}", room, e.getMessage());
      return Map.of();
    }
  }

  /** Disconnects a user from the room's documents (all, or only the listed ones) and the whiteboard. */
  public void revokeUser(String room, UUID userId, List<String> documents, boolean whiteboard) {
    Map<String, Object> body = documents == null ? Map.of("userId", userId.toString()) : Map.of("userId", userId.toString(), "documents", documents);
    call(editor, "/internal/rooms/{room}/revoke", room, body);
    if (whiteboard) call(canvas, "/internal/rooms/{room}/revoke", room, Map.of("userId", userId.toString()));
  }

  /** The interview ended: close every connection to the room's documents and whiteboard. */
  public void closeRoom(String room) {
    call(editor, "/internal/rooms/{room}/close", room, Map.of());
    call(canvas, "/internal/rooms/{room}/close", room, Map.of());
  }

  private void call(RestClient client, String path, String room, Map<String, ?> body) {
    try {
      client
          .post()
          .uri(path, room)
          .header(INTERNAL_HEADER, ticketService.internalToken())
          .contentType(MediaType.APPLICATION_JSON)
          .body(body)
          .retrieve()
          .toBodilessEntity();
    } catch (Exception e) {
      log.warn("[Collab] {} for room {} failed: {}", path, room, e.getMessage());
    }
  }
}
