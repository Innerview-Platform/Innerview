package com.innerview.spring.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * Precomputed profile numbers, so a profile read is one row lookup. Always recomputed from the
 * feedback and user_interview tables (never incremented), so it cannot drift — see UserStatsService.
 */
@Entity
@Table(name = "user_stats")
@Getter
@Setter
@NoArgsConstructor
public class UserStats {
  @Id
  @Column(name = "user_id")
  private UUID userId;

  @Column(name = "rating_sum", nullable = false)
  private long ratingSum;

  @Column(name = "rating_count", nullable = false)
  private long ratingCount;

  /** Completed interviews as interviewer or candidate (observers excluded); each interview counts once. */
  @Column(name = "completed_interviews", nullable = false)
  private long completedInterviews;

  @Column(name = "interviews_as_candidate", nullable = false)
  private long interviewsAsCandidate;

  @Column(name = "interviews_as_interviewer", nullable = false)
  private long interviewsAsInterviewer;

  @UpdateTimestamp
  @Column(name = "updated_at")
  private LocalDateTime updatedAt;

  public UserStats(UUID userId) {
    this.userId = userId;
  }

  /** Average rating rounded to one decimal, or null before the first review. */
  public Double averageRating() {
    return ratingCount == 0 ? null : Math.round(ratingSum * 10.0 / ratingCount) / 10.0;
  }
}
