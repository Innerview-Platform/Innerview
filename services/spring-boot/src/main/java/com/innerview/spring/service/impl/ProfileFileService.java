package com.innerview.spring.service.impl;

import com.innerview.spring.core.util.RateLimiter;
import com.innerview.spring.dto.file.AvatarFiles;
import com.innerview.spring.dto.file.FileContent;
import com.innerview.spring.dto.file.StoredFileInfo;
import com.innerview.spring.dto.profile.AvatarResponse;
import com.innerview.spring.dto.profile.ResumeInfo;
import com.innerview.spring.entity.User;
import com.innerview.spring.entity.UserProfile;
import com.innerview.spring.enums.StoredFileKind;
import com.innerview.spring.exception.ApiException;
import com.innerview.spring.repository.UserInterviewRepository;
import com.innerview.spring.repository.UserProfileRepository;
import com.innerview.spring.repository.UserRepository;
import java.time.Duration;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * Profile photo and resume: upload, replace, delete and read. Avatars are public (served by id);
 * a resume is readable by its owner, and by the interviewers of a live interview with that user.
 */
@Service
@RequiredArgsConstructor
public class ProfileFileService {
  static final String AVATAR_PATH = "/api/files/avatars/";
  private static final int UPLOADS_PER_HOUR = 20;

  private final FileUploadService files;
  private final UserProfileRepository profiles;
  private final UserRepository users;
  private final UserInterviewRepository userInterviews;
  private final RateLimiter rateLimiter;

  @Transactional
  public AvatarResponse replaceAvatar(UUID userId, MultipartFile upload) {
    limitUploads(userId);
    UserProfile profile = profileFor(userId);
    AvatarFiles stored = files.storeAvatar(userId, upload);
    UUID oldFull = profile.getAvatarFileId();
    UUID oldThumb = profile.getAvatarThumbFileId();
    profile.setAvatarFileId(stored.full().id());
    profile.setAvatarThumbFileId(stored.thumbnail().id());
    profiles.save(profile);
    deleteAll(oldFull, oldThumb);
    return avatarOf(profile);
  }

  @Transactional
  public void deleteAvatar(UUID userId) {
    profiles.getUserProfileByUser_Id(userId).ifPresent(profile -> {
      deleteAll(profile.getAvatarFileId(), profile.getAvatarThumbFileId());
      profile.setAvatarFileId(null);
      profile.setAvatarThumbFileId(null);
      profile.setImageUrl(null);
      profiles.save(profile);
    });
  }

  @Transactional
  public ResumeInfo replaceResume(UUID userId, MultipartFile upload) {
    limitUploads(userId);
    UserProfile profile = profileFor(userId);
    StoredFileInfo stored = files.storeResume(userId, upload);
    UUID old = profile.getResumeFileId();
    profile.setResumeFileId(stored.id());
    profiles.save(profile);
    deleteAll(old);
    return toResumeInfo(stored);
  }

  @Transactional
  public void deleteResume(UUID userId) {
    profiles.getUserProfileByUser_Id(userId).ifPresent(profile -> {
      deleteAll(profile.getResumeFileId());
      profile.setResumeFileId(null);
      profiles.save(profile);
    });
  }

  @Transactional(readOnly = true)
  public FileContent ownResume(UUID userId) {
    return resumeOf(userId).orElseThrow(() -> ApiException.notFound("You haven't uploaded a resume."));
  }

  /** A participant's resume for an interviewer, only while the interview is live. */
  @Transactional(readOnly = true)
  public FileContent resumeForInterview(Long interviewId, UUID viewerId, UUID candidateId) {
    if (!viewerId.equals(candidateId)
        && !userInterviews.canViewResumeDuringInterview(interviewId, viewerId, candidateId)) {
      throw ApiException.forbidden(
          "RESUME_NOT_AVAILABLE", "Resumes are only visible to interviewers while the interview is running.");
    }
    return resumeOf(candidateId).orElseThrow(() -> ApiException.notFound("This participant hasn't uploaded a resume."));
  }

  /** Only avatar kinds are served publicly — never a resume, even if someone guesses its id. */
  @Transactional(readOnly = true)
  public FileContent avatar(UUID fileId) {
    return files.open(fileId)
        .filter(content -> content.info().kind() == StoredFileKind.AVATAR || content.info().kind() == StoredFileKind.AVATAR_THUMB)
        .orElseThrow(() -> ApiException.notFound("Image not found"));
  }

  @Transactional(readOnly = true)
  public Optional<ResumeInfo> resumeInfo(UserProfile profile) {
    return Optional.ofNullable(profile.getResumeFileId()).flatMap(files::info).map(ProfileFileService::toResumeInfo);
  }

  /** Uploaded photo first, then a legacy external image URL. */
  public static AvatarResponse avatarOf(UserProfile profile) {
    if (profile.getAvatarFileId() != null) {
      return new AvatarResponse(
          AVATAR_PATH + profile.getAvatarFileId(),
          AVATAR_PATH + (profile.getAvatarThumbFileId() != null ? profile.getAvatarThumbFileId() : profile.getAvatarFileId()));
    }
    return new AvatarResponse(profile.getImageUrl(), profile.getImageUrl());
  }

  private Optional<FileContent> resumeOf(UUID userId) {
    return profiles.getUserProfileByUser_Id(userId)
        .map(UserProfile::getResumeFileId)
        .flatMap(files::open);
  }

  private UserProfile profileFor(UUID userId) {
    return profiles.getUserProfileByUser_Id(userId).orElseGet(() -> {
      User user = users.findById(userId).orElseThrow(() -> ApiException.notFound("User not found"));
      UserProfile created = new UserProfile();
      created.setUser(user);
      return created;
    });
  }

  private void limitUploads(UUID userId) {
    rateLimiter.check("upload:" + userId, UPLOADS_PER_HOUR, Duration.ofHours(1), "Too many uploads — try again later.");
  }

  private void deleteAll(UUID... ids) {
    Stream.of(ids).filter(java.util.Objects::nonNull).forEach(files::delete);
  }

  private static ResumeInfo toResumeInfo(StoredFileInfo info) {
    return new ResumeInfo(info.originalFilename(), info.contentType(), info.size(), info.createdAt());
  }
}
