package com.innerview.spring.service.impl;

import com.innerview.spring.core.util.ProfileFieldRules;
import com.innerview.spring.core.util.UsernameRules;
import com.innerview.spring.dto.InterviewHistoryDto;
import com.innerview.spring.dto.RegisterRequest;
import com.innerview.spring.dto.UserAverageRatingResponse;
import com.innerview.spring.dto.profile.AvatarResponse;
import com.innerview.spring.dto.profile.MyProfileResponse;
import com.innerview.spring.dto.profile.PublicProfileResponse;
import com.innerview.spring.dto.profile.UpdateProfileRequest;
import com.innerview.spring.entity.User;
import com.innerview.spring.entity.UserProfile;
import com.innerview.spring.entity.UserStats;
import com.innerview.spring.enums.InterviewStatus;
import com.innerview.spring.enums.InterviewType;
import com.innerview.spring.exception.ApiException;
import com.innerview.spring.repository.UserInterviewRepository;
import com.innerview.spring.repository.UserProfileRepository;
import com.innerview.spring.repository.UserRepository;
import com.innerview.spring.service.UserProfileService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserProfileServiceImpl implements UserProfileService {

    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;
    private final UserInterviewRepository userInterviewRepository;
    private final UsernameService usernameService;
    private final ProfileFileService profileFileService;
    private final UserStatsService userStatsService;

    @Override
    @Transactional
    public void createInitialProfile(User user, RegisterRequest request) {
        UserProfile profile = new UserProfile();
        profile.setUser(user);
        ProfileFieldRules.applyEmployment(profile, request.getEmploymentStatus(), request.getCompany());
        profile.setUniversity(ProfileFieldRules.required(request.getUniversity(), "University"));
        profile.setCollege(ProfileFieldRules.required(request.getCollege(), "College"));
        profile.setHeadline(ProfileFieldRules.optional(request.getHeadline()));
        userProfileRepository.save(profile);
    }

    @Override
    @Transactional(readOnly = true)
    public MyProfileResponse getMyProfile(UUID userId) {
        User user = findUser(userId);
        UserProfile profile = userProfileRepository.getUserProfileByUser_Id(userId).orElseGet(UserProfile::new);
        return toMyProfile(user, profile);
    }

    @Override
    @Transactional
    public MyProfileResponse updateMyProfile(UUID userId, UpdateProfileRequest request) {
        User user = findUser(userId);
        // Older and Google accounts have no profile row yet; the first save creates it.
        UserProfile profile = userProfileRepository.getUserProfileByUser_Id(userId).orElseGet(() -> {
            UserProfile created = new UserProfile();
            created.setUser(user);
            return created;
        });

        if (request.getName() != null) user.setName(ProfileFieldRules.required(request.getName(), "Name"));
        if (request.getUsername() != null) usernameService.assign(user, request.getUsername());
        if (request.getEmploymentStatus() != null || request.getCompany() != null) {
            ProfileFieldRules.applyEmployment(
                    profile,
                    request.getEmploymentStatus() != null ? request.getEmploymentStatus() : profile.getEmploymentStatus(),
                    request.getCompany() != null ? request.getCompany() : profile.getCompany());
        }
        if (request.getUniversity() != null) profile.setUniversity(ProfileFieldRules.required(request.getUniversity(), "University"));
        if (request.getCollege() != null) profile.setCollege(ProfileFieldRules.required(request.getCollege(), "College"));
        if (request.getHeadline() != null) profile.setHeadline(ProfileFieldRules.optional(request.getHeadline()));
        if (request.getExperienceLevel() != null) profile.setExperienceLevel(request.getExperienceLevel());
        if (request.getPreferredRole() != null) profile.setPreferredRole(request.getPreferredRole());
        if (request.getBio() != null) profile.setBio(bio(request.getBio()));
        if (request.getLocation() != null) profile.setLocation(ProfileFieldRules.optional(request.getLocation()));
        if (request.getTimezone() != null) profile.setTimezone(ProfileFieldRules.timezone(request.getTimezone()));
        if (request.getLinkedinUrl() != null) {
            profile.setLinkedinUrl(ProfileFieldRules.httpsUrl(request.getLinkedinUrl(), "LinkedIn URL", "linkedin.com"));
        }
        if (request.getGithubUrl() != null) {
            profile.setGithubUrl(ProfileFieldRules.httpsUrl(request.getGithubUrl(), "GitHub URL", "github.com"));
        }
        if (request.getPortfolioUrl() != null) {
            profile.setPortfolioUrl(ProfileFieldRules.httpsUrl(request.getPortfolioUrl(), "Portfolio URL", null));
        }
        if (request.getShowEmail() != null) profile.setShowEmail(request.getShowEmail());

        try {
            userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException e) {
            // Someone claimed the same username between the check and the update.
            throw UsernameService.taken();
        }
        return toMyProfile(user, userProfileRepository.save(profile));
    }

    @Override
    @Transactional(readOnly = true)
    public PublicProfileResponse getPublicProfile(UUID viewerId, String username) {
        User user = userRepository.findByUsername(UsernameRules.normalize(username))
                .orElseThrow(() -> ApiException.notFound("User not found"));
        UUID userId = user.getId();
        UserProfile profile = userProfileRepository.getUserProfileByUser_Id(userId).orElseGet(UserProfile::new);
        UserStats stats = userStatsService.statsFor(userId);
        boolean showEmail = profile.isShowEmail() || userId.equals(viewerId);
        return new PublicProfileResponse(
                user.getId(),
                user.getUsername(),
                user.getName(),
                showEmail ? user.getEmail() : null,
                ProfileFileService.avatarOf(profile).avatarUrl(),
                ProfileFileService.avatarOf(profile).avatarThumbUrl(),
                profile.getHeadline(),
                profile.getEmploymentStatus(),
                profile.getCompany(),
                profile.getUniversity(),
                profile.getCollege(),
                profile.getExperienceLevel(),
                profile.getPreferredRole(),
                profile.getBio(),
                profile.getLocation(),
                profile.getTimezone(),
                profile.getLinkedinUrl(),
                profile.getGithubUrl(),
                profile.getPortfolioUrl(),
                stats.averageRating(),
                stats.getRatingCount(),
                stats.getCompletedInterviews(),
                stats.getInterviewsAsCandidate(),
                stats.getInterviewsAsInterviewer(),
                user.getCreatedAt());
    }

    @Override
    @Transactional(readOnly = true)
    public UserAverageRatingResponse getAverageRatingById(UUID userId) {
        findUser(userId);
        UserStats stats = userStatsService.statsFor(userId);
        Double average = stats.averageRating();
        return new UserAverageRatingResponse(userId, average == null ? 0.0 : average, stats.getRatingCount());
    }

    @Override
    public Page<InterviewHistoryDto> getUserInterviewHistory(
            UUID userId,
            InterviewStatus status,
            InterviewType type,
            int page,
            int limit) {
        Pageable pageable = PageRequest.of(page, limit, Sort.by(Sort.Direction.DESC, "interview.startTime"));
        return userInterviewRepository.findInterviewHistoryByUser(userId, status, type, pageable);
    }

    private User findUser(UUID userId) {
        return userRepository.findById(userId).orElseThrow(() -> ApiException.notFound("User not found"));
    }

    /** Keeps line breaks (unlike other fields) but trims and treats blank as cleared. */
    private static String bio(String value) {
        String trimmed = value.strip();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private MyProfileResponse toMyProfile(User user, UserProfile profile) {
        AvatarResponse avatar = ProfileFileService.avatarOf(profile);
        UserStats stats = userStatsService.statsFor(user.getId());
        return new MyProfileResponse(
                user.getId(),
                user.getUsername(),
                user.getName(),
                user.getEmail(),
                profile.getHeadline(),
                profile.getEmploymentStatus(),
                profile.getCompany(),
                profile.getUniversity(),
                profile.getCollege(),
                profile.getExperienceLevel(),
                profile.getPreferredRole(),
                profile.getBio(),
                profile.getLocation(),
                profile.getTimezone(),
                profile.getLinkedinUrl(),
                profile.getGithubUrl(),
                profile.getPortfolioUrl(),
                profile.isShowEmail(),
                user.getPasswordHash() != null && !user.getPasswordHash().isBlank(),
                avatar.avatarUrl(),
                avatar.avatarThumbUrl(),
                profileFileService.resumeInfo(profile).orElse(null),
                stats.averageRating(),
                stats.getRatingCount(),
                stats.getCompletedInterviews(),
                stats.getInterviewsAsCandidate(),
                stats.getInterviewsAsInterviewer(),
                profile.isComplete() && user.getUsername() != null,
                user.getCreatedAt());
    }
}
