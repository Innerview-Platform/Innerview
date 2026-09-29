package com.innerview.spring.entity;

import com.innerview.spring.enums.AccessPolicy;
import com.innerview.spring.enums.InterviewRole;
import com.innerview.spring.enums.InterviewType;
import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import lombok.Data;

/** A live interview room (in memory; the interview row in PostgreSQL is the durable record). */
@Data
public class ActiveRoom {
  /** Canonical room code (see RoomUtil). */
  private String code;
  private Long interviewId;
  private InterviewType type;
  private String title;
  /** The interview's creator. */
  private UUID ownerId;
  private InterviewRole ownerRole;
  /** Who currently has host rights: the owner while present, otherwise handed to someone else. */
  private volatile UUID hostId;
  /** -1 = unlimited. */
  private int maxParticipants;
  private RoomUiConfig uiConfig;
  private volatile AccessPolicy accessPolicy;
  private volatile Instant endsAt;
  private volatile boolean extended;
  private volatile boolean warningSent;
  private Instant createdAt;
  /** False while only the lobby exists (someone asked to join before anyone entered). */
  private volatile boolean live;
  /** Set while nobody is connected; the room closes after a while. */
  private volatile Instant emptySince;

  /** Everyone admitted during this session, including people who left (they may rejoin). */
  private final Map<UUID, RoomParticipant> participants = new ConcurrentHashMap<>();
  /** Removed by the host or an interviewer; must not get back in. */
  private final Set<UUID> blocked = ConcurrentHashMap.newKeySet();
  /** Lobby requests by id. */
  private final Map<String, AccessRequest> requests = new ConcurrentHashMap<>();
  /** How many times each user was denied (they can ask at most three times). */
  private final Map<UUID, Integer> denials = new ConcurrentHashMap<>();

  public long activeCount() {
    return participants.values().stream().filter(RoomParticipant::isActive).count();
  }

  /** Host or interviewer: may admit, remove and end. */
  public boolean isStaff(UUID userId) {
    if (userId.equals(hostId)) return true;
    RoomParticipant p = participants.get(userId);
    return p != null && p.getRole() == InterviewRole.INTERVIEWER;
  }
}
