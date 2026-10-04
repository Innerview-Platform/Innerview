package com.innerview.spring.controller;

import com.innerview.spring.dto.InterviewHistoryDto;
import com.innerview.spring.dto.UserAverageRatingResponse;
import com.innerview.spring.dto.profile.DeleteAccountRequest;
import com.innerview.spring.dto.profile.MyProfileResponse;
import com.innerview.spring.dto.profile.PublicProfileResponse;
import com.innerview.spring.dto.profile.UpdateProfileRequest;
import com.innerview.spring.enums.InterviewStatus;
import com.innerview.spring.enums.InterviewType;
import com.innerview.spring.service.UserProfileService;
import com.innerview.spring.service.impl.AccountDeletionService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Profiles. The public profile and rating are visible to every signed-in user; interview history
 * is only available for yourself (/me). Reviews are in ReviewController, files in ProfileFilesController.
 */
@RestController
@AllArgsConstructor
@RequestMapping("/api/profile")
public class UserProfileController {

    private final UserProfileService userProfileService;
    private final AccountDeletionService accountDeletionService;

    @GetMapping("/me")
    public ResponseEntity<MyProfileResponse> getMyProfile(@AuthenticationPrincipal UUID currentUserId) {
        return ResponseEntity.ok(userProfileService.getMyProfile(currentUserId));
    }

    @PutMapping("/me")
    public ResponseEntity<MyProfileResponse> updateMyProfile(
            @AuthenticationPrincipal UUID currentUserId, @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userProfileService.updateMyProfile(currentUserId, request));
    }

    /**
     * Deletes the signed-in account (see AccountDeletionService) and clears the refresh-token cookie.
     * POST rather than DELETE-with-body, which some proxies drop.
     */
    @PostMapping("/me/delete-account")
    public ResponseEntity<Void> deleteMyAccount(
            @AuthenticationPrincipal UUID currentUserId, @Valid @RequestBody DeleteAccountRequest request) {
        accountDeletionService.deleteAccount(currentUserId, request);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, ResponseCookie.from("refresh_token", "").path("/api/auth").maxAge(0).build().toString())
                .build();
    }

    /** Public profile by username (case-insensitive). */
    @GetMapping("/{username}")
    public ResponseEntity<PublicProfileResponse> getPublicProfile(
            @AuthenticationPrincipal UUID currentUserId, @PathVariable String username) {
        return ResponseEntity.ok(userProfileService.getPublicProfile(currentUserId, username));
    }

    @GetMapping("/{userId}/rating")
    public ResponseEntity<UserAverageRatingResponse> getUserAverageRating(@PathVariable UUID userId) {
        return ResponseEntity.ok(userProfileService.getAverageRatingById(userId));
    }

    /** The signed-in user's interview history, newest first. */
    @GetMapping("/me/interviews")
    public ResponseEntity<Page<InterviewHistoryDto>> getMyInterviews(
            @AuthenticationPrincipal UUID currentUserId,
            @RequestParam(required = false) InterviewStatus status,
            @RequestParam(required = false) InterviewType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ResponseEntity.ok(userProfileService.getUserInterviewHistory(currentUserId, status, type, page, limit));
    }
}
