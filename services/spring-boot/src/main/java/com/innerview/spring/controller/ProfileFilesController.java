package com.innerview.spring.controller;

import com.innerview.spring.dto.file.FileContent;
import com.innerview.spring.dto.profile.AvatarResponse;
import com.innerview.spring.dto.profile.ResumeInfo;
import com.innerview.spring.service.impl.ProfileFileService;
import java.time.Duration;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.multipart.MultipartFile;

/** Profile photo and resume uploads (multipart field "file", 5 MB max) and downloads. */
@RestController
@RequiredArgsConstructor
public class ProfileFilesController {
  private final ProfileFileService profileFiles;

  @PutMapping(path = "/api/profile/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<AvatarResponse> uploadAvatar(
      @AuthenticationPrincipal UUID currentUserId, @RequestParam("file") MultipartFile file) {
    return ResponseEntity.ok(profileFiles.replaceAvatar(currentUserId, file));
  }

  @DeleteMapping("/api/profile/me/avatar")
  public ResponseEntity<Void> deleteAvatar(@AuthenticationPrincipal UUID currentUserId) {
    profileFiles.deleteAvatar(currentUserId);
    return ResponseEntity.noContent().build();
  }

  @PutMapping(path = "/api/profile/me/resume", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<ResumeInfo> uploadResume(
      @AuthenticationPrincipal UUID currentUserId, @RequestParam("file") MultipartFile file) {
    return ResponseEntity.ok(profileFiles.replaceResume(currentUserId, file));
  }

  @DeleteMapping("/api/profile/me/resume")
  public ResponseEntity<Void> deleteResume(@AuthenticationPrincipal UUID currentUserId) {
    profileFiles.deleteResume(currentUserId);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/api/profile/me/resume")
  public ResponseEntity<byte[]> ownResume(@AuthenticationPrincipal UUID currentUserId) {
    return document(profileFiles.ownResume(currentUserId));
  }

  /** An interview participant's resume, for that interview's interviewers while it is live. */
  @GetMapping("/api/interviews/{interviewId}/participants/{userId}/resume")
  public ResponseEntity<byte[]> participantResume(
      @AuthenticationPrincipal UUID currentUserId, @PathVariable Long interviewId, @PathVariable UUID userId) {
    return document(profileFiles.resumeForInterview(interviewId, currentUserId, userId));
  }

  /**
   * Public, so it works in {@code <img src>} (which can't send the access token). Every upload gets a
   * new id, so the response never changes and browsers may cache it for a year.
   */
  @GetMapping("/api/files/avatars/{fileId}")
  public ResponseEntity<byte[]> avatar(@PathVariable UUID fileId, WebRequest request) {
    FileContent image = profileFiles.avatar(fileId);
    String etag = '"' + image.info().sha256() + '"';
    if (request.checkNotModified(etag)) return null;
    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType(image.info().contentType()))
        .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
        .eTag(etag)
        .header("X-Content-Type-Options", "nosniff")
        .body(image.bytes());
  }

  private static ResponseEntity<byte[]> document(FileContent file) {
    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType(file.info().contentType()))
        .header(HttpHeaders.CONTENT_DISPOSITION,
            ContentDisposition.inline().filename(file.info().originalFilename(), java.nio.charset.StandardCharsets.UTF_8).build().toString())
        .cacheControl(CacheControl.noStore().cachePrivate())
        .header("X-Content-Type-Options", "nosniff")
        .body(file.bytes());
  }
}
