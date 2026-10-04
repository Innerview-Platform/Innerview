package com.innerview.spring.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.innerview.spring.dto.RegisterRequest;
import com.innerview.spring.entity.UserStats;
import com.innerview.spring.dto.profile.MyProfileResponse;
import com.innerview.spring.dto.profile.PublicProfileResponse;
import com.innerview.spring.dto.profile.UpdateProfileRequest;
import com.innerview.spring.entity.User;
import com.innerview.spring.entity.UserProfile;
import com.innerview.spring.enums.EmploymentStatus;
import com.innerview.spring.exception.ApiException;
import com.innerview.spring.repository.UserInterviewRepository;
import com.innerview.spring.repository.UserProfileRepository;
import com.innerview.spring.repository.UserRepository;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UserProfileServiceImplTest {
  @Mock UserProfileRepository profiles;
  @Mock UserRepository users;
  @Mock UserInterviewRepository userInterviews;
  @Mock UsernameService usernames;
  @Mock ProfileFileService profileFiles;
  @Mock UserStatsService userStats;
  @InjectMocks UserProfileServiceImpl service;

  private User user;
  private UserProfile profile;

  @BeforeEach
  void setUp() {
    user = new User();
    user.setId(UUID.randomUUID());
    user.setName("Jane Doe");
    user.setEmail("jane@example.com");
    user.setUsername("jane");
    profile = new UserProfile();
    profile.setUser(user);
    profile.setEmploymentStatus(EmploymentStatus.EMPLOYED);
    profile.setCompany("Acme");
    profile.setUniversity("Cairo University");
    profile.setCollege("Faculty of Engineering");
    profile.setHeadline("Engineer");
    lenient().when(userStats.statsFor(any())).thenAnswer(invocation -> new UserStats(invocation.getArgument(0)));
  }

  @Test
  void createInitialProfile_SavesNormalizedFields() {
    RegisterRequest request = RegisterRequest.builder()
        .employmentStatus(EmploymentStatus.STUDENT).company("ignored")
        .university("  Cairo University ").college("Engineering").headline(" ").build();

    service.createInitialProfile(user, request);

    ArgumentCaptor<UserProfile> saved = ArgumentCaptor.forClass(UserProfile.class);
    verify(profiles).save(saved.capture());
    assertThat(saved.getValue().getUser()).isSameAs(user);
    assertThat(saved.getValue().getCompany()).isNull();
    assertThat(saved.getValue().getUniversity()).isEqualTo("Cairo University");
    assertThat(saved.getValue().getHeadline()).isNull();
    assertThat(saved.getValue().isComplete()).isTrue();
  }

  @Test
  void createInitialProfile_RequiresCompanyWhenEmployed() {
    RegisterRequest request = RegisterRequest.builder()
        .employmentStatus(EmploymentStatus.EMPLOYED).university("U").college("C").build();

    assertThatThrownBy(() -> service.createInitialProfile(user, request)).isInstanceOf(ApiException.class);
    verify(profiles, never()).save(any());
  }

  @Test
  void getMyProfile_IsIncompleteWithoutAUsername() {
    user.setUsername(null);
    when(users.findById(user.getId())).thenReturn(Optional.of(user));
    when(profiles.getUserProfileByUser_Id(user.getId())).thenReturn(Optional.of(profile));

    assertThat(service.getMyProfile(user.getId()).profileComplete()).isFalse();
  }

  @Test
  void updateMyProfile_AssignsTheUsername() {
    stubOwnProfile();
    UpdateProfileRequest request = new UpdateProfileRequest();
    request.setUsername("Jane.Doe");

    service.updateMyProfile(user.getId(), request);

    verify(usernames).assign(user, "Jane.Doe");
  }

  @Test
  void getMyProfile_ReportsMissingProfilesAsIncomplete() {
    when(users.findById(user.getId())).thenReturn(Optional.of(user));
    when(profiles.getUserProfileByUser_Id(user.getId())).thenReturn(Optional.empty());

    MyProfileResponse response = service.getMyProfile(user.getId());

    assertThat(response.name()).isEqualTo("Jane Doe");
    assertThat(response.profileComplete()).isFalse();
  }

  @Test
  void updateMyProfile_MergesClearsAndValidates() {
    stubOwnProfile();
    UpdateProfileRequest request = new UpdateProfileRequest();
    request.setHeadline("");
    request.setEmploymentStatus(EmploymentStatus.NOT_EMPLOYED);
    request.setGithubUrl("github.com/jane");
    request.setTimezone("Africa/Cairo");
    request.setShowEmail(true);

    MyProfileResponse response = service.updateMyProfile(user.getId(), request);

    assertThat(response.headline()).isNull();
    assertThat(response.company()).isNull();
    assertThat(response.university()).isEqualTo("Cairo University");
    assertThat(response.githubUrl()).isEqualTo("https://github.com/jane");
    assertThat(response.showEmail()).isTrue();
    assertThat(response.profileComplete()).isTrue();
  }

  @Test
  void updateMyProfile_CannotClearRequiredFields() {
    when(users.findById(user.getId())).thenReturn(Optional.of(user));
    when(profiles.getUserProfileByUser_Id(user.getId())).thenReturn(Optional.of(profile));
    UpdateProfileRequest request = new UpdateProfileRequest();
    request.setCollege("  ");

    assertThatThrownBy(() -> service.updateMyProfile(user.getId(), request))
        .isInstanceOf(ApiException.class).extracting("code").isEqualTo("FIELD_REQUIRED");
    verify(profiles, never()).save(any());
  }

  @Test
  void updateMyProfile_CreatesTheProfileForOlderAccounts() {
    // Completeness also needs a username, which this account already has.
    when(users.findById(user.getId())).thenReturn(Optional.of(user));
    when(profiles.getUserProfileByUser_Id(user.getId())).thenReturn(Optional.empty());
    when(profiles.save(any(UserProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));
    UpdateProfileRequest request = new UpdateProfileRequest();
    request.setEmploymentStatus(EmploymentStatus.STUDENT);
    request.setUniversity("AUC");
    request.setCollege("Engineering");

    MyProfileResponse response = service.updateMyProfile(user.getId(), request);

    assertThat(response.profileComplete()).isTrue();
  }

  @Test
  void getPublicProfile_HidesEmailUnlessShared() {
    stubPublicLookups(0L, 0L);
    UUID viewer = UUID.randomUUID();

    assertThat(service.getPublicProfile(viewer, "jane").email()).isNull();
    assertThat(service.getPublicProfile(user.getId(), "Jane").email()).isEqualTo("jane@example.com");
    profile.setShowEmail(true);
    assertThat(service.getPublicProfile(viewer, "jane").email()).isEqualTo("jane@example.com");
  }

  @Test
  void getPublicProfile_IncludesRoundedRatingAndInterviewCount() {
    UserStats stats = stubPublicLookups(3L, 14L);
    stats.setCompletedInterviews(7);
    stats.setInterviewsAsCandidate(4);
    stats.setInterviewsAsInterviewer(3);

    PublicProfileResponse response = service.getPublicProfile(UUID.randomUUID(), "jane");

    assertThat(response.averageRating()).isEqualTo(4.7);
    assertThat(response.totalReviews()).isEqualTo(3);
    assertThat(response.totalInterviews()).isEqualTo(7);
    assertThat(response.interviewsAsCandidate()).isEqualTo(4);
    assertThat(response.university()).isEqualTo("Cairo University");
  }

  @Test
  void getPublicProfile_HasNoRatingBeforeAnyReview() {
    stubPublicLookups(0L, 0L);
    assertThat(service.getPublicProfile(UUID.randomUUID(), "jane").averageRating()).isNull();
  }

  @Test
  void profilesShowTheUploadedAvatarBeforeALegacyImageUrl() {
    stubPublicLookups(0L, 0L);
    profile.setImageUrl("https://example.com/old.png");
    assertThat(service.getPublicProfile(UUID.randomUUID(), "jane").avatarUrl()).isEqualTo("https://example.com/old.png");

    UUID full = UUID.randomUUID();
    UUID thumb = UUID.randomUUID();
    profile.setAvatarFileId(full);
    profile.setAvatarThumbFileId(thumb);
    PublicProfileResponse response = service.getPublicProfile(UUID.randomUUID(), "jane");
    assertThat(response.avatarUrl()).isEqualTo("/api/files/avatars/" + full);
    assertThat(response.avatarThumbUrl()).isEqualTo("/api/files/avatars/" + thumb);
  }

  @Test
  void unknownUsersAreNotFound() {
    when(users.findByUsername("ghost")).thenReturn(Optional.empty());
    assertThatThrownBy(() -> service.getPublicProfile(UUID.randomUUID(), "ghost"))
        .isInstanceOf(ApiException.class).extracting("code").isEqualTo("NOT_FOUND");
  }

  private void stubOwnProfile() {
    when(users.findById(user.getId())).thenReturn(Optional.of(user));
    when(profiles.getUserProfileByUser_Id(user.getId())).thenReturn(Optional.of(profile));
    when(profiles.save(any(UserProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));
  }

  private UserStats stubPublicLookups(long ratingCount, long ratingSum) {
    when(users.findByUsername("jane")).thenReturn(Optional.of(user));
    when(profiles.getUserProfileByUser_Id(user.getId())).thenReturn(Optional.of(profile));
    UserStats stats = new UserStats(user.getId());
    stats.setRatingCount(ratingCount);
    stats.setRatingSum(ratingSum);
    when(userStats.statsFor(user.getId())).thenReturn(stats);
    return stats;
  }
}
