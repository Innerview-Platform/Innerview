package com.innerview.spring.dto.profile;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import com.innerview.spring.enums.EmploymentStatus;
import com.innerview.spring.enums.ExperienceLevel;
import com.innerview.spring.enums.InterviewRole;
import java.time.LocalDateTime;
import java.util.UUID;

/** GET/PUT /api/profile/me — everything the owner can see and edit. */
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record MyProfileResponse(
    UUID userId,
    String username,
    String name,
    String email,
    String headline,
    EmploymentStatus employmentStatus,
    String company,
    String university,
    String college,
    ExperienceLevel experienceLevel,
    InterviewRole preferredRole,
    String bio,
    String location,
    String timezone,
    String linkedinUrl,
    String githubUrl,
    String portfolioUrl,
    boolean showEmail,
    /** False for Google-only accounts (no password to confirm with, e.g. when deleting the account). */
    boolean hasPassword,
    String avatarUrl,
    String avatarThumbUrl,
    /** Null when no resume is uploaded. */
    ResumeInfo resume,
    Double averageRating,
    long totalReviews,
    long totalInterviews,
    long interviewsAsCandidate,
    long interviewsAsInterviewer,
    /** False until every field required at sign-up, including the username, is filled (older and Google accounts). */
    boolean profileComplete,
    LocalDateTime memberSince) {}
