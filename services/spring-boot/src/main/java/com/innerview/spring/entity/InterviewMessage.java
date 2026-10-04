package com.innerview.spring.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.Data;

/** A chat message sent in an interview room; kept for the interview summary. */
@Entity
@Table(name = "interview_messages", indexes = @Index(name = "idx_messages_interview", columnList = "interview_id"))
@Data
public class InterviewMessage {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "interview_id", nullable = false)
  private Long interviewId;

  @Column(nullable = false)
  private UUID senderId;

  @Column(nullable = false)
  private String senderName;

  @Column(columnDefinition = "TEXT", nullable = false)
  private String text;

  @Column(nullable = false)
  private Instant sentAt;
}
