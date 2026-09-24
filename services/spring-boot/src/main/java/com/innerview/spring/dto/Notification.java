package com.innerview.spring.dto;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.UUID;

public abstract class Notification {

  private static final ObjectMapper MAPPER = new ObjectMapper();

  private static final DateTimeFormatter DISPLAY_TIME_FMT =
      DateTimeFormatter.ofPattern("EEEE, MMMM d yyyy 'at' h:mm a 'UTC'").withZone(ZoneOffset.UTC);

  private final String notificationId;
  private final String recipientId;
  private final String recipientEmail;
  private final Instant createdAt;

  protected Notification(String recipientId, String recipientEmail) {
    this.notificationId = UUID.randomUUID().toString();
    this.recipientId = recipientId;
    this.recipientEmail = recipientEmail;
    this.createdAt = Instant.now();
  }

  public String getNotificationId() {
    return notificationId;
  }

  public String getRecipientId() {
    return recipientId;
  }

  public String getReciepentEmail() {
    return recipientEmail;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  /** Human-readable "EEEE, MMMM d yyyy 'at' h:mm a 'UTC'" rendering, or "TBD" if null. */
  protected static String formatInstant(Instant instant) {
    return instant != null ? DISPLAY_TIME_FMT.format(instant) : "TBD";
  }

  /** Serializes {@code fields} to a compact JSON string for the in-app notification payload. */
  protected static String toJson(Map<String, Object> fields) {
    try {
      return MAPPER.writeValueAsString(fields);
    } catch (JsonProcessingException e) {
      throw new IllegalStateException("Failed to serialize notification content", e);
    }
  }
}
