package com.innerview.spring.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Value;

/**
 * Broadcast on /topic/room/{roomId}/run so every participant sees the same terminal.
 *
 * <p>Types: {@code state} (current language / whether a run is active), {@code language} (someone
 * switched the room's language), {@code started}, {@code runtime}, {@code stage}, {@code stdout},
 * {@code stderr}, {@code stdin} (echo of input someone typed), {@code exit}, {@code error},
 * {@code finished} (the run is over and a new one can start).
 */
@Value
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CodeRunEvent {
    String type;
    String runId;
    String userId;
    String language;
    String version;
    String stage;
    String data;
    Integer code;
    String signal;
    Boolean running;
}
