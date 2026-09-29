package com.innerview.spring.entity;

import com.innerview.spring.enums.InterviewStatus;
import com.innerview.spring.enums.InterviewType;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

/**
 * Set of interviews associated with this user. *
 *
 * <p><b>Index Strategy:</b>
 *
 * <ul>
 *   <li><b>Clustered Index:</b> (user_id, interview_id). This optimizes for user-centric queries
 *       like "Count all interviews for User X".
 *   <li><b>Secondary Index:</b> (interview_id). This ensures that reverse lookups (finding all
 *       participants in a specific session) are O(log N).
 * </ul>
 */
@Entity
@Table(name = "interviews")
@Data
public class Interview {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Enumerated(EnumType.STRING)
  private InterviewType type;

  @Enumerated(EnumType.STRING)
  private InterviewStatus status;

  private Integer roomSize;

  @ManyToMany(mappedBy = "interviews")
  private List<User> participants;

  private Instant startTime;
  private Instant endTime;
  private Integer durationMinutes;
  private UUID ownerId;
  private String roomId;

  /** Final content of the shared code editor, saved when the interview ends. */
  @Column(columnDefinition = "TEXT")
  private String sharedCode;

  /** Final problem statement / notes, saved when the interview ends. */
  @Column(columnDefinition = "TEXT")
  private String problemNotes;

  /** Interviewers' private notes (never shown to the candidate). */
  @Column(columnDefinition = "TEXT")
  private String interviewerNotes;

  /** Optional name shown in lists, invites and the room header. */
  @Column(length = 120)
  private String title;

  /** Who may enter without being let in; null in older rows means ASK_TO_JOIN. */
  @Enumerated(EnumType.STRING)
  @Column(length = 20)
  private com.innerview.spring.enums.AccessPolicy accessPolicy;

  /** The host may extend a live interview once. */
  private Boolean extended;

  /** The creator's role in their own interview (they're always the host). */
  @Enumerated(EnumType.STRING)
  @Column(length = 20)
  private com.innerview.spring.enums.InterviewRole ownerRole;

  /** When the first person entered the room (null until then). */
  private Instant liveSince;

  public com.innerview.spring.enums.AccessPolicy effectiveAccessPolicy() {
    return accessPolicy == null ? com.innerview.spring.enums.AccessPolicy.ASK_TO_JOIN : accessPolicy;
  }

  @ManyToMany
  @JoinTable(
      name = "interview_problems",
      joinColumns = @JoinColumn(name = "interview_id"),
      inverseJoinColumns = @JoinColumn(name = "problem_id"))
  private List<Problem> problems = new ArrayList<>();

  @CreationTimestamp private LocalDateTime createdAt;
}
