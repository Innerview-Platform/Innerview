package com.innerview.spring.entity;

import com.innerview.spring.enums.EmploymentStatus;
import com.innerview.spring.enums.ExperienceLevel;
import com.innerview.spring.enums.InterviewRole;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Professional profile, created together with the user at sign-up. Users created before profiles
 * were required (and Google sign-ups) may have no row yet; the API reports them as incomplete.
 * Columns stay nullable in the database so existing rows keep working; the API enforces what is required.
 */
@Entity
@Table(name = "user_profiles")
@Data
public class UserProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;

    /** Job title or short tagline, e.g. "Backend Engineer". */
    @Column(length = 120)
    private String headline;

    @Enumerated(EnumType.STRING)
    @Column(name = "employment_status", length = 20)
    private EmploymentStatus employmentStatus;

    /** Required when employmentStatus is EMPLOYED, otherwise null. */
    @Column(length = 100)
    private String company;

    @Column(length = 150)
    private String university;

    /** Faculty/college within the university. */
    @Column(length = 150)
    private String college;

    @Enumerated(EnumType.STRING)
    private ExperienceLevel experienceLevel;

    @Enumerated(EnumType.STRING)
    private InterviewRole preferredRole;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(length = 100)
    private String location;

    /** IANA time zone id, e.g. "Africa/Cairo". */
    @Column(length = 64)
    private String timezone;

    @Column(name = "linkedin_url")
    private String linkedinUrl;

    @Column(name = "github_url")
    private String githubUrl;

    @Column(name = "portfolio_url")
    private String portfolioUrl;

    /** Whether other users can see this user's email on the public profile. */
    @Column(name = "show_email", nullable = false, columnDefinition = "boolean default false")
    private boolean showEmail;

    /** Legacy external photo URL; used only when no avatar has been uploaded. */
    private String imageUrl;

    /** stored_files ids (see FileUploadService). Kept as plain ids so loading a profile never loads file bytes. */
    @Column(name = "avatar_file_id")
    private java.util.UUID avatarFileId;

    @Column(name = "avatar_thumb_file_id")
    private java.util.UUID avatarThumbFileId;

    @Column(name = "resume_file_id")
    private java.util.UUID resumeFileId;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    /** Has every field required at sign-up. */
    public boolean isComplete() {
        return employmentStatus != null
                && (employmentStatus != EmploymentStatus.EMPLOYED || hasText(company))
                && hasText(university)
                && hasText(college);
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
