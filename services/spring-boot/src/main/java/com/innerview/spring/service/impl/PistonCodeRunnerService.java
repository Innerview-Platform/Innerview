package com.innerview.spring.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.innerview.spring.dto.CodeRunEvent;
import com.innerview.spring.dto.RunCodeSignalPayload;
import com.innerview.spring.dto.RuntimeDto;
import com.innerview.spring.service.CodeRunnerService;
import com.innerview.spring.core.util.RateLimiter;
import jakarta.annotation.PreDestroy;
import jakarta.websocket.ContainerProvider;
import jakarta.websocket.WebSocketContainer;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.regex.Pattern;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.handler.ConcurrentWebSocketSessionDecorator;
import org.springframework.web.socket.handler.TextWebSocketHandler;

/**
 * Interactive code execution through Piston's WebSocket API (/api/v2/connect).
 *
 * <p>For every run the backend opens one WebSocket to Piston and relays its stdout/stderr/exit
 * messages to /topic/room/{roomId}/run. Input typed by any participant is forwarded to the
 * process's stdin, so the terminal behaves like a shared console.
 */
@Slf4j
@Service
public class PistonCodeRunnerService implements CodeRunnerService {

  private static final String DEFAULT_LANGUAGE = "python";
  private static final int MAX_CODE_LENGTH = 64 * 1024;
  private static final int MAX_INPUT_LENGTH = 4 * 1024;
  private static final int MAX_MESSAGE_BYTES = 512 * 1024;

  /**
   * Noise printed by Piston's compile scripts that isn't the user's output: Mono's compiler banner,
   * and gcc's follow-up `chmod a.out` failure after a compile error.
   */
  private static final Pattern COMPILE_NOISE =
      Pattern.compile(
          "(?m)^(Microsoft \\(R\\) Visual C# Compiler version .*|Copyright \\(C\\) Microsoft Corporation\\. All rights reserved\\.|chmod: cannot access 'a\\.out': No such file or directory)\\R?");

  /**
   * Source file names; interpreters need the right extension. Piston's gcc script appends .c/.cpp
   * itself, so C and C++ sources get no extension (otherwise errors mention "main.cpp.cpp").
   */
  private static final Map<String, String> FILE_NAMES =
      Map.ofEntries(
          Map.entry("python", "main.py"),
          Map.entry("javascript", "main.js"),
          Map.entry("typescript", "main.ts"),
          Map.entry("c", "main"),
          Map.entry("c++", "main"),
          Map.entry("java", "Main.java"),
          Map.entry("go", "main.go"),
          Map.entry("rust", "main.rs"),
          Map.entry("csharp", "Main.cs"),
          Map.entry("kotlin", "Main.kt"),
          Map.entry("php", "main.php"),
          Map.entry("ruby", "main.rb"),
          Map.entry("bash", "main.sh"));

  private final SimpMessagingTemplate messagingTemplate;
  private final RateLimiter rateLimiter;
  private final ObjectMapper objectMapper;
  private final RestClient restClient;
  private final StandardWebSocketClient webSocketClient;
  private final String pistonBaseUrl;
  private final String connectUrl;
  private final int runTimeoutMs;
  private final int runCpuTimeMs;

  private final Map<String, ActiveRun> activeRuns = new ConcurrentHashMap<>();
  private final Map<String, String> roomLanguages = new ConcurrentHashMap<>();

  public PistonCodeRunnerService(
      SimpMessagingTemplate messagingTemplate,
      RateLimiter rateLimiter,
      ObjectMapper objectMapper,
      @Value("${piston.url:http://127.0.0.1:2000}") String pistonUrl,
      @Value("${piston.interactive.run-timeout-ms:300000}") int runTimeoutMs,
      @Value("${piston.interactive.run-cpu-time-ms:10000}") int runCpuTimeMs) {
    this.messagingTemplate = messagingTemplate;
    this.rateLimiter = rateLimiter;
    this.objectMapper = objectMapper;
    this.pistonBaseUrl = pistonUrl.replaceAll("/+$", "");
    this.connectUrl = pistonBaseUrl.replaceFirst("^http", "ws") + "/api/v2/connect";
    this.runTimeoutMs = runTimeoutMs;
    this.runCpuTimeMs = runCpuTimeMs;

    SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
    factory.setConnectTimeout(5_000);
    factory.setReadTimeout(10_000);
    this.restClient = RestClient.builder().requestFactory(factory).baseUrl(pistonBaseUrl).build();

    // Piston sends each output chunk as one text frame; the default 8 KB buffer is too small.
    WebSocketContainer container = ContainerProvider.getWebSocketContainer();
    container.setDefaultMaxTextMessageBufferSize(MAX_MESSAGE_BYTES);
    this.webSocketClient = new StandardWebSocketClient(container);
  }

  @Override
  public List<RuntimeDto> listRuntimes() {
    List<RuntimeDto> runtimes =
        restClient.get().uri("/api/v2/runtimes").retrieve().body(new ParameterizedTypeReference<>() {});
    return runtimes == null ? List.of() : runtimes;
  }

  // ─── run lifecycle ────────────────────────────────────────────────────────

  @Override
  public void run(String roomId, UUID userId, RunCodeSignalPayload payload) {
    String language = normalizeLanguage(payload.getLanguage());
    String code = payload.getPlainText() == null ? "" : payload.getPlainText();

    if (code.isBlank()) {
      publishError(roomId, null, userId, "There is no code to run.");
      return;
    }
    if (code.length() > MAX_CODE_LENGTH) {
      publishError(roomId, null, userId, "The code is too large to run (limit is 64 KB).");
      return;
    }

    ActiveRun current = activeRuns.get(roomId);
    if (current != null && !current.userId.equals(userId) && !payload.isForce()) {
      // Someone else's program is running: the client asks "Stop theirs and run yours?" first.
      messagingTemplate.convertAndSendToUser(
          userId.toString(),
          "/queue/errors",
          Map.of("code", "RUN_BUSY", "room", roomId, "message", "Another participant's program is still running", "startedBy", current.userId.toString()));
      return;
    }
    if (!rateLimiter.tryAcquire("run:" + roomId, 12, java.time.Duration.ofMinutes(1))) {
      publishError(roomId, null, userId, "Too many runs in a short time — wait a few seconds and try again.");
      return;
    }

    if (current != null) {
      publish(roomId, CodeRunEvent.builder().type("stopped").runId(current.runId).userId(userId.toString()).build());
    }
    stopActiveRun(roomId);
    roomLanguages.put(roomId, language);

    String runId = UUID.randomUUID().toString();
    ActiveRun run = new ActiveRun(runId, roomId, userId);
    activeRuns.put(roomId, run);

    publish(
        roomId,
        CodeRunEvent.builder()
            .type("started")
            .runId(runId)
            .userId(userId.toString())
            .language(language)
            .running(true)
            .build());

    Map<String, Object> init = new LinkedHashMap<>();
    init.put("type", "init");
    init.put("language", language);
    init.put("version", "*");
    init.put("files", List.of(Map.of("name", fileNameFor(language), "content", code)));
    init.put("args", List.of());
    init.put("run_timeout", runTimeoutMs);
    init.put("run_cpu_time", runCpuTimeMs);

    webSocketClient
        .execute(new PistonRunHandler(run, init), connectUrl)
        .orTimeout(10, TimeUnit.SECONDS)
        .whenComplete(
            (session, error) -> {
              if (error == null) return;
              log.warn("[Runner] Could not reach Piston at {}: {}", connectUrl, error.getMessage());
              publishError(roomId, runId, null, "The code execution service is unavailable. Try again shortly.");
              finish(run);
            });

    log.info("[Runner] User {} started a {} run in room {}", userId, language, roomId);
  }

  @Override
  public void sendInput(String roomId, UUID userId, String data) {
    ActiveRun run = activeRuns.get(roomId);
    if (run == null || run.session == null || data == null || data.isEmpty()) return;
    String input = data.length() > MAX_INPUT_LENGTH ? data.substring(0, MAX_INPUT_LENGTH) : data;

    try {
      run.session.sendMessage(json(Map.of("type", "data", "stream", "stdin", "data", input)));
      publish(
          roomId,
          CodeRunEvent.builder().type("stdin").runId(run.runId).userId(userId.toString()).data(input).build());
    } catch (IOException | IllegalStateException e) {
      log.debug("[Runner] Failed to forward stdin in room {}: {}", roomId, e.getMessage());
    }
  }

  @Override
  public void stop(String roomId, UUID userId) {
    ActiveRun run = activeRuns.get(roomId);
    if (run == null) return;
    log.info("[Runner] User {} stopped the run in room {}", userId, roomId);
    publish(roomId, CodeRunEvent.builder().type("stopped").runId(run.runId).userId(userId.toString()).build());
    stopActiveRun(roomId);
  }

  @Override
  public void stopRoom(String roomId) {
    stopActiveRun(roomId);
    roomLanguages.remove(roomId);
  }

  @Override
  public void changeLanguage(String roomId, UUID userId, String language) {
    String normalized = normalizeLanguage(language);
    roomLanguages.put(roomId, normalized);
    publish(
        roomId,
        CodeRunEvent.builder().type("language").userId(userId.toString()).language(normalized).build());
  }

  @Override
  public void broadcastState(String roomId) {
    ActiveRun run = activeRuns.get(roomId);
    publish(
        roomId,
        CodeRunEvent.builder()
            .type("state")
            .runId(run == null ? null : run.runId)
            .language(roomLanguages.getOrDefault(roomId, DEFAULT_LANGUAGE))
            .running(run != null)
            .build());
  }

  @PreDestroy
  void shutdown() {
    activeRuns.keySet().forEach(this::stopActiveRun);
  }

  // ─── internals ────────────────────────────────────────────────────────────

  private void stopActiveRun(String roomId) {
    ActiveRun run = activeRuns.get(roomId);
    if (run == null) return;
    WebSocketSession session = run.session;
    if (session != null && session.isOpen()) {
      try {
        session.sendMessage(json(Map.of("type", "signal", "signal", "SIGKILL")));
      } catch (IOException | IllegalStateException ignored) {
        // Closing below is enough.
      }
      try {
        session.close(CloseStatus.NORMAL);
      } catch (IOException ignored) {
        // Already closed.
      }
    }
    publish(
        roomId,
        CodeRunEvent.builder().type("exit").runId(run.runId).stage("run").signal("SIGKILL").build());
    finish(run);
  }

  /** Marks the run as over (once) and tells the room a new run can start. */
  private void finish(ActiveRun run) {
    if (!run.finished.compareAndSet(false, true)) return;
    activeRuns.remove(run.roomId, run);
    publish(
        run.roomId,
        CodeRunEvent.builder().type("finished").runId(run.runId).running(false).build());
  }

  private boolean isCurrent(ActiveRun run) {
    return !run.finished.get() && activeRuns.get(run.roomId) == run;
  }

  private void publish(String roomId, CodeRunEvent event) {
    messagingTemplate.convertAndSend("/topic/room/" + roomId + "/run", event);
  }

  private void publishError(String roomId, String runId, UUID userId, String message) {
    publish(
        roomId,
        CodeRunEvent.builder()
            .type("error")
            .runId(runId)
            .userId(userId == null ? null : userId.toString())
            .data(message)
            .build());
  }

  private TextMessage json(Object value) throws IOException {
    return new TextMessage(objectMapper.writeValueAsString(value));
  }

  private static String normalizeLanguage(String language) {
    if (language == null || language.isBlank()) return DEFAULT_LANGUAGE;
    String lower = language.trim().toLowerCase();
    return switch (lower) {
      case "cpp" -> "c++";
      case "js", "node" -> "javascript";
      case "ts" -> "typescript";
      case "py", "python3" -> "python";
      case "cs", "c#" -> "csharp";
      default -> lower;
    };
  }

  private static String fileNameFor(String language) {
    return FILE_NAMES.getOrDefault(language, "main");
  }

  private static final class ActiveRun {
    final String runId;
    final String roomId;
    final UUID userId;
    final AtomicBoolean finished = new AtomicBoolean(false);
    volatile WebSocketSession session;

    ActiveRun(String runId, String roomId, UUID userId) {
      this.runId = runId;
      this.roomId = roomId;
      this.userId = userId;
    }
  }

  /** Relays one Piston job's messages to the room. */
  private final class PistonRunHandler extends TextWebSocketHandler {
    private final ActiveRun run;
    private final Map<String, Object> init;
    private volatile String stage;

    PistonRunHandler(ActiveRun run, Map<String, Object> init) {
      this.run = run;
      this.init = init;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession rawSession) throws Exception {
      // Output events and stdin/stop requests arrive on different threads.
      WebSocketSession session = new ConcurrentWebSocketSessionDecorator(rawSession, 5_000, MAX_MESSAGE_BYTES);
      run.session = session;
      if (!isCurrent(run)) {
        session.close(CloseStatus.NORMAL);
        return;
      }
      // Piston closes the socket if `init` doesn't arrive within one second.
      session.sendMessage(json(init));
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
      if (!isCurrent(run)) return;
      JsonNode node = objectMapper.readTree(message.getPayload());
      String type = node.path("type").asText();

      CodeRunEvent.CodeRunEventBuilder event = CodeRunEvent.builder().runId(run.runId);
      switch (type) {
        case "runtime" ->
            event.type("runtime").language(node.path("language").asText()).version(node.path("version").asText());
        case "stage" -> {
          stage = node.path("stage").asText();
          event.type("stage").stage(stage);
        }
        case "data" -> {
          String data = node.path("data").asText();
          if ("compile".equals(stage)) {
            String cleaned = COMPILE_NOISE.matcher(data).replaceAll("");
            if (!cleaned.equals(data)) data = cleaned.stripLeading(); // drop the blank line after the banner
          }
          if (data.isEmpty()) return;
          event.type(node.path("stream").asText("stdout")).data(data);
        }
        case "exit" ->
            event
                .type("exit")
                .stage(node.path("stage").asText())
                .code(node.hasNonNull("code") ? node.get("code").asInt() : null)
                .signal(node.hasNonNull("signal") ? node.get("signal").asText() : null);
        case "error" -> event.type("error").data(node.path("message").asText("Execution failed"));
        default -> {
          return;
        }
      }
      publish(run.roomId, event.build());
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
      log.warn("[Runner] Piston connection error in room {}: {}", run.roomId, exception.getMessage());
      if (isCurrent(run)) publishError(run.roomId, run.runId, null, "Lost connection to the code execution service.");
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
      // 4999 = job completed; 4002 = error already sent as a message; anything else is unexpected.
      if (isCurrent(run) && status.getCode() != 4999 && status.getCode() != 4002) {
        publishError(run.roomId, run.runId, null, "Execution ended unexpectedly: " + describe(status));
      }
      finish(run);
    }

    private String describe(CloseStatus status) {
      String reason = status.getReason();
      return reason == null || reason.isBlank()
          ? "code " + status.getCode()
          : reason + " (" + status.getCode() + ")";
    }
  }
}
