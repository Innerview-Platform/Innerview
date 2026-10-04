package com.innerview.spring.dto.profile;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import com.innerview.spring.enums.EmploymentStatus;
import com.innerview.spring.enums.ExperienceLevel;
import com.innerview.spring.enums.InterviewRole;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * PUT /api/profile/me. Fields that are null are left unchanged. An empty string clears an optional
 * field; required fields (name, university, college, company when employed) cannot be cleared.
 */
@Data
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class UpdateProfileRequest {
  /** Format and uniqueness are checked in UsernameService. */
  @Size(max = 30, message = "Username must be at most 30 characters")
  private String username;

  @Size(min = 3, max = 100, message = "Name must be between 3 and 100 characters")
  private String name;

  @Size(max = 120, message = "Headline must be at most 120 characters")
  private String headline;

  private EmploymentStatus employmentStatus;

  @Size(max = 100, message = "Company must be at most 100 characters")
  private String company;

  @Size(max = 150, message = "University must be at most 150 characters")
  private String university;

  @Size(max = 150, message = "College must be at most 150 characters")
  private String college;

  private ExperienceLevel experienceLevel;

  private InterviewRole preferredRole;

  @Size(max = 2000, message = "Bio must be at most 2000 characters")
  private String bio;

  @Size(max = 100, message = "Location must be at most 100 characters")
  private String location;

  @Size(max = 64, message = "Time zone must be at most 64 characters")
  private String timezone;

  @Size(max = 255, message = "LinkedIn URL must be at most 255 characters")
  private String linkedinUrl;

  @Size(max = 255, message = "GitHub URL must be at most 255 characters")
  private String githubUrl;

  @Size(max = 255, message = "Portfolio URL must be at most 255 characters")
  private String portfolioUrl;

  private Boolean showEmail;
}
