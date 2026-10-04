package com.innerview.spring.service;

import com.innerview.spring.dto.InterviewHistoryDto;
import com.innerview.spring.dto.RegisterRequest;
import com.innerview.spring.dto.UserAverageRatingResponse;
import com.innerview.spring.dto.profile.MyProfileResponse;
import com.innerview.spring.dto.profile.PublicProfileResponse;
import com.innerview.spring.dto.profile.UpdateProfileRequest;
import com.innerview.spring.entity.User;
import com.innerview.spring.enums.InterviewStatus;
import com.innerview.spring.enums.InterviewType;
import java.util.UUID;
import org.springframework.data.domain.Page;

public interface UserProfileService {

    /** Creates the profile for a newly registered user, in the caller's transaction. */
    void createInitialProfile(User user, RegisterRequest request);

    MyProfileResponse getMyProfile(UUID userId);

    MyProfileResponse updateMyProfile(UUID userId, UpdateProfileRequest request);

    PublicProfileResponse getPublicProfile(UUID viewerId, String username);

    UserAverageRatingResponse getAverageRatingById(UUID userId);

    Page<InterviewHistoryDto> getUserInterviewHistory(
            UUID userId,
            InterviewStatus status,
            InterviewType type,
            int page,
            int limit);
}
