package com.innerview.spring.dto.review;

import com.innerview.spring.enums.HireSignal;
import com.innerview.spring.enums.InterviewRole;
import com.innerview.spring.enums.InterviewType;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

/** One review joined with the other person and the interview (JPQL constructor result). */
public record ReviewRow(
    Long id,
    UUID personId,
    String personUsername,
    String personName,
    UUID personAvatarFileId,
    UUID personAvatarThumbFileId,
    String personImageUrl,
    InterviewRole reviewerRole,
    Integer rating,
    String comment,
    HireSignal hireSignal,
    Long interviewId,
    String interviewTitle,
    InterviewType interviewType,
    Instant interviewStartTime,
    LocalDateTime createdAt) {}
