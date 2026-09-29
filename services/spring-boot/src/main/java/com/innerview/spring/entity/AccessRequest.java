package com.innerview.spring.entity;

import com.innerview.spring.enums.InterviewRole;
import java.time.Instant;
import java.util.UUID;
import lombok.Data;

/** "Ask to join": someone waiting in the lobby for the host or an interviewer to let them in. */
@Data
public class AccessRequest {
  public enum Status { PENDING, ADMITTED, DENIED, EXPIRED, CANCELLED }

  private String id;
  private UUID userId;
  private String name;
  private String email;
  private Instant requestedAt;
  private volatile Status status = Status.PENDING;
  private InterviewRole admittedRole;
  private String decidedBy;
}
