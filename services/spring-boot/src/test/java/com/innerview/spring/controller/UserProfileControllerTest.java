package com.innerview.spring.controller;

import com.innerview.spring.dto.InterviewHistoryDto;
import com.innerview.spring.dto.UserAverageRatingResponse;
import com.innerview.spring.enums.ExperienceLevel;
import com.innerview.spring.enums.InterviewRole;
import com.innerview.spring.enums.InterviewStatus;
import com.innerview.spring.enums.InterviewType;
import com.innerview.spring.dto.profile.MyProfileResponse;
import com.innerview.spring.dto.profile.PublicProfileResponse;
import com.innerview.spring.dto.profile.UpdateProfileRequest;
import com.innerview.spring.enums.EmploymentStatus;
import com.innerview.spring.exception.ApiException;
import com.innerview.spring.exception.ApiExceptionHandler;
import com.innerview.spring.exception.UserExceptionHandler;
import com.innerview.spring.exception.UserNotFound;
import com.innerview.spring.service.UserProfileService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
public class UserProfileControllerTest {

    private MockMvc mockMvc;

    @Mock
    private UserProfileService userProfileService;

    @InjectMocks
    private UserProfileController userProfileController;

    private UUID currentUserId;

    @BeforeEach
    void setUp() {
        currentUserId = UUID.randomUUID();

        // Setup MockMvc with custom ArgumentResolver to mock @AuthenticationPrincipal
        mockMvc = MockMvcBuilders.standaloneSetup(userProfileController)
                .setControllerAdvice(new UserExceptionHandler(), new ApiExceptionHandler()) // Wire in your exception handler
                .setCustomArgumentResolvers(new HandlerMethodArgumentResolver() {
                    @Override
                    public boolean supportsParameter(MethodParameter parameter) {
                        return parameter.getParameterType().equals(UUID.class);
                    }

                    @Override
                    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                                  NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                        return currentUserId;
                    }
                })
                .build();
    }


    // ==================== 1. Own profile ====================

    private MyProfileResponse myProfile(boolean complete) {
        return new MyProfileResponse(
                currentUserId, "jane", "Jane Doe", "jane@example.com", "Backend Engineer", EmploymentStatus.EMPLOYED,
                "Acme", "Cairo University", "Faculty of Engineering", ExperienceLevel.JUNIOR, InterviewRole.BOTH,
                "Bio", "Cairo", "Africa/Cairo", "https://linkedin.com/in/jane", null, null, false, true, null, null, null,
                4.5, 2, 3, 2, 1, complete, LocalDateTime.now());
    }

    @Test
    void getMyProfile_ReturnsSnakeCaseProfileWithCompleteness() throws Exception {
        when(userProfileService.getMyProfile(currentUserId)).thenReturn(myProfile(true));

        mockMvc.perform(get("/api/profile/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user_id").value(currentUserId.toString()))
                .andExpect(jsonPath("$.employment_status").value("EMPLOYED"))
                .andExpect(jsonPath("$.university").value("Cairo University"))
                .andExpect(jsonPath("$.show_email").value(false))
                .andExpect(jsonPath("$.profile_complete").value(true));
    }

    @Test
    void updateMyProfile_PassesSnakeCaseFieldsToTheService() throws Exception {
        when(userProfileService.updateMyProfile(eq(currentUserId), any(UpdateProfileRequest.class))).thenReturn(myProfile(true));

        mockMvc.perform(put("/api/profile/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"employment_status\":\"STUDENT\",\"linkedin_url\":\"linkedin.com/in/jane\",\"show_email\":true}"))
                .andExpect(status().isOk());

        verify(userProfileService).updateMyProfile(eq(currentUserId), argThat(request ->
                request.getEmploymentStatus() == EmploymentStatus.STUDENT
                        && "linkedin.com/in/jane".equals(request.getLinkedinUrl())
                        && Boolean.TRUE.equals(request.getShowEmail())));
    }

    @Test
    void updateMyProfile_RejectsOversizedFields() throws Exception {
        mockMvc.perform(put("/api/profile/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"headline\":\"" + "x".repeat(121) + "\"}"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(userProfileService);
    }

    @Test
    void updateMyProfile_ReturnsServiceValidationErrors() throws Exception {
        when(userProfileService.updateMyProfile(eq(currentUserId), any(UpdateProfileRequest.class)))
                .thenThrow(ApiException.badRequest("INVALID_URL", "GitHub URL must be a github.com link."));

        mockMvc.perform(put("/api/profile/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"github_url\":\"https://evil.example\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_URL"));
    }

    // ==================== 2. Public profile ====================

    @Test
    void getPublicProfile_LooksUpByUsername() throws Exception {
        UUID targetUserId = UUID.randomUUID();
        PublicProfileResponse response = new PublicProfileResponse(
                targetUserId, "omar", "Omar", null, null, null, "SRE", EmploymentStatus.STUDENT, null, "AUC", "Engineering",
                null, null, null, null, null, null, null, null, 4.5, 2, 3, 2, 1, LocalDateTime.now());
        when(userProfileService.getPublicProfile(currentUserId, "Omar")).thenReturn(response);

        mockMvc.perform(get("/api/profile/{username}", "Omar"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("omar"))
                .andExpect(jsonPath("$.name").value("Omar"))
                .andExpect(jsonPath("$.email").doesNotExist())
                .andExpect(jsonPath("$.average_rating").value(4.5))
                .andExpect(jsonPath("$.total_interviews").value(3));
    }

    @Test
    void getUserAverageRating_ShouldReturnCorrectAverageRating() throws Exception {
        UUID targetUserId = UUID.randomUUID();
        UserAverageRatingResponse response = new UserAverageRatingResponse(targetUserId, 4.5, 10L);

        when(userProfileService.getAverageRatingById(targetUserId)).thenReturn(response);

        mockMvc.perform(get("/api/profile/{userId}/rating", targetUserId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user_id").value(targetUserId.toString()))
                .andExpect(jsonPath("$.average_rating").value(4.5))
                .andExpect(jsonPath("$.total_reviews").value(10));
    }

    @Test
    void getUserAverageRating_ShouldReturn0IfNoRatingsExist() throws Exception {
        UUID targetUserId = UUID.randomUUID();
        UserAverageRatingResponse response = new UserAverageRatingResponse(targetUserId, 0.0, 0L);

        when(userProfileService.getAverageRatingById(targetUserId)).thenReturn(response);

        mockMvc.perform(get("/api/profile/{userId}/rating", targetUserId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.average_rating").value(0.0))
                .andExpect(jsonPath("$.total_reviews").value(0));
    }

    @Test
    void getUserAverageRating_ShouldReturn404IfUserNotFound() throws Exception {
        UUID targetUserId = UUID.randomUUID();
        when(userProfileService.getAverageRatingById(targetUserId))
                .thenThrow(new UserNotFound("User not found"));

        mockMvc.perform(get("/api/profile/{userId}/rating", targetUserId))
                .andExpect(status().isNotFound());
    }



    @Test
    void getUserInterviews_ShouldReturnUserInterviews() throws Exception {
        UUID targetUserId = currentUserId;
        InterviewHistoryDto interview = new InterviewHistoryDto(1L, "MOCK", Instant.now(), 60, "INTERVIEWER");

        // FIX: Add PageRequest.of() and total elements
        Page<InterviewHistoryDto> page = new PageImpl<>(List.of(interview), PageRequest.of(0, 10), 1);

        when(userProfileService.getUserInterviewHistory(eq(targetUserId), isNull(), isNull(), eq(0), eq(10)))
                .thenReturn(page);

        mockMvc.perform(get("/api/profile/me/interviews")
                        .param("page", "0")
                        .param("limit", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].interview_id").value(1))
                .andExpect(jsonPath("$.content[0].type").value("MOCK"));
    }

    @Test
    void getUserInterviews_ShouldReturnEmptyListIfNoInterviewsExist() throws Exception {
        UUID targetUserId = currentUserId;

        // FIX: Add PageRequest.of() and total elements
        Page<InterviewHistoryDto> emptyPage = new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 10), 0);

        when(userProfileService.getUserInterviewHistory(eq(targetUserId), isNull(), isNull(), eq(0), eq(10)))
                .thenReturn(emptyPage);

        mockMvc.perform(get("/api/profile/me/interviews"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isEmpty());
    }
}
