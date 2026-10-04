package com.innerview.spring.entity;

import com.innerview.spring.enums.InterviewRole;
import com.innerview.spring.enums.InviteStatus;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

/**
 * A person invited to an interview by email. Invitees join the room directly (no lobby); someone
 * who signs up later with the same email is matched automatically.
 */
@Entity
@Table(
    name = "interview_invites",
    uniqueConstraints = @UniqueConstraint(columnNames = {"interview_id", "email"}),
    indexes = @Index(name = "idx_invites_email", columnList = "email"))
@Data
public class InterviewInvite {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "interview_id", nullable = false)
  private Long interviewId;

  @Column(nullable = false)
  private String email;

  /** Set once the invitee has an account (at invite time or when they first join). */
  private UUID userId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private InterviewRole role;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private InviteStatus status = InviteStatus.PENDING;

  private UUID invitedBy;

  @CreationTimestamp private Instant createdAt;
}
