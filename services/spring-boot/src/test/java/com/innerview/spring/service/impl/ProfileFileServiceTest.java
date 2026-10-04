package com.innerview.spring.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.innerview.spring.core.util.RateLimiter;
import com.innerview.spring.dto.file.AvatarFiles;
import com.innerview.spring.dto.file.FileContent;
import com.innerview.spring.dto.file.StoredFileInfo;
import com.innerview.spring.entity.User;
import com.innerview.spring.entity.UserProfile;
import com.innerview.spring.enums.StoredFileKind;
import com.innerview.spring.exception.ApiException;
import com.innerview.spring.repository.UserInterviewRepository;
import com.innerview.spring.repository.UserProfileRepository;
import com.innerview.spring.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

@ExtendWith(MockitoExtension.class)
class ProfileFileServiceTest {
  @Mock FileUploadService files;
  @Mock UserProfileRepository profiles;
  @Mock UserRepository users;
  @Mock UserInterviewRepository userInterviews;
  @Spy RateLimiter rateLimiter = new RateLimiter();
  @InjectMocks ProfileFileService service;

  private final UUID candidateId = UUID.randomUUID();
  private final UUID interviewerId = UUID.randomUUID();
  private UserProfile profile;

  @BeforeEach
  void setUp() {
    User user = new User();
    user.setId(candidateId);
    profile = new UserProfile();
    profile.setUser(user);
  }

  private static StoredFileInfo info(StoredFileKind kind) {
    return new StoredFileInfo(UUID.randomUUID(), UUID.randomUUID(), kind, "application/pdf", "cv.pdf", 10, "sha", LocalDateTime.now());
  }

  @Test
  void replacingAnAvatarDeletesTheOldFiles() {
    UUID oldFull = UUID.randomUUID();
    UUID oldThumb = UUID.randomUUID();
    profile.setAvatarFileId(oldFull);
    profile.setAvatarThumbFileId(oldThumb);
    when(profiles.getUserProfileByUser_Id(candidateId)).thenReturn(Optional.of(profile));
    AvatarFiles stored = new AvatarFiles(info(StoredFileKind.AVATAR), info(StoredFileKind.AVATAR_THUMB));
    when(files.storeAvatar(any(), any())).thenReturn(stored);

    var response = service.replaceAvatar(candidateId, new MockMultipartFile("file", new byte[] {1}));

    assertThat(response.avatarUrl()).isEqualTo("/api/files/avatars/" + stored.full().id());
    assertThat(profile.getAvatarThumbFileId()).isEqualTo(stored.thumbnail().id());
    verify(files).delete(oldFull);
    verify(files).delete(oldThumb);
  }

  @Test
  void interviewersSeeTheResumeOnlyDuringALiveInterview() {
    UUID resumeId = UUID.randomUUID();
    profile.setResumeFileId(resumeId);
    FileContent resume = new FileContent(info(StoredFileKind.RESUME), new byte[] {1});
    when(profiles.getUserProfileByUser_Id(candidateId)).thenReturn(Optional.of(profile));
    when(files.open(resumeId)).thenReturn(Optional.of(resume));
    when(userInterviews.canViewResumeDuringInterview(7L, interviewerId, candidateId)).thenReturn(true);

    assertThat(service.resumeForInterview(7L, interviewerId, candidateId)).isSameAs(resume);
  }

  @Test
  void othersAreRefusedWithoutLoadingTheFile() {
    when(userInterviews.canViewResumeDuringInterview(7L, interviewerId, candidateId)).thenReturn(false);

    assertThatThrownBy(() -> service.resumeForInterview(7L, interviewerId, candidateId))
        .isInstanceOf(ApiException.class).extracting("code").isEqualTo("RESUME_NOT_AVAILABLE");
    verify(files, never()).open(any());
  }

  @Test
  void theAvatarRouteNeverServesResumes() {
    UUID resumeId = UUID.randomUUID();
    when(files.open(resumeId)).thenReturn(Optional.of(new FileContent(info(StoredFileKind.RESUME), new byte[] {1})));

    assertThatThrownBy(() -> service.avatar(resumeId))
        .isInstanceOf(ApiException.class).extracting("code").isEqualTo("NOT_FOUND");
  }

  @Test
  void uploadsAreRateLimited() {
    when(profiles.getUserProfileByUser_Id(candidateId)).thenReturn(Optional.of(profile));
    when(files.storeResume(any(), any())).thenAnswer(invocation -> info(StoredFileKind.RESUME));
    for (int i = 0; i < 20; i++) service.replaceResume(candidateId, new MockMultipartFile("file", new byte[] {1}));

    assertThatThrownBy(() -> service.replaceResume(candidateId, new MockMultipartFile("file", new byte[] {1})))
        .isInstanceOf(ApiException.class).extracting("code").isEqualTo("RATE_LIMITED");
  }
}
