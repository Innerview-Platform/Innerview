package com.innerview.spring.dto.profile;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import com.innerview.spring.enums.EmploymentStatus;
import com.innerview.spring.enums.ExperienceLevel;
import com.innerview.spring.enums.InterviewRole;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * GET /api/profile/{username} — what any signed-in user can see. {@code email} is null unless the
 * user enabled "show email" (or is viewing their own profile); {@code averageRating} is null until
 * the user has been reviewed.
 */
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record PublicProfileResponse(
    UUID userId,
    String username,
    String name,
    String email,
    String avatarUrl,
    String avatarThumbUrl,
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
    Double averageRating,
    long totalReviews,
    long totalInterviews,
    long interviewsAsCandidate,
    long interviewsAsInterviewer,
    LocalDateTime memberSince) {}
