package com.innerview.spring.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "feedback",
        uniqueConstraints = @UniqueConstraint(columnNames = {"interview_id", "reviewer_id", "reviewee_id"}))
@Data
public class Feedback {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interview_id", nullable = false)
    private Interview interview;

    @Column(nullable = false)
    private Integer rating; // 1-5

    @Column(columnDefinition = "TEXT")
    private String comment;

    /** Scorecard: rubric criterion id → score 1-5 (see FeedbackRubric). */
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    private java.util.Map<String, Integer> scores;

    /** Interviewer's recommendation (only when an interviewer reviews the candidate). */
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private com.innerview.spring.enums.HireSignal hireSignal;

    /** The reviewer's role in the interview. */
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private com.innerview.spring.enums.InterviewRole reviewerRole;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id", nullable = false)
    private User reviewer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewee_id", nullable = false)
    private User reviewee;

    @CreationTimestamp
    private LocalDateTime createdAt;
}