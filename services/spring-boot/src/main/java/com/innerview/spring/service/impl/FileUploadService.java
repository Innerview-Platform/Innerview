package com.innerview.spring.service.impl;

import com.innerview.spring.core.file.DocumentValidator;
import com.innerview.spring.core.file.FileSignature;
import com.innerview.spring.core.file.ImageProcessor;
import com.innerview.spring.core.file.UploadLimits;
import com.innerview.spring.dto.file.AvatarFiles;
import com.innerview.spring.dto.file.FileContent;
import com.innerview.spring.dto.file.StoredFileInfo;
import com.innerview.spring.enums.StoredFileKind;
import com.innerview.spring.exception.ApiException;
import com.innerview.spring.service.FileStorage;
import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * Validates, processes and stores uploaded profile photos and resumes. Every upload is identified by
 * its content (magic bytes), then fully decoded or parsed before anything is stored.
 */
@Service
@RequiredArgsConstructor
public class FileUploadService {
  private static final int MAX_FILENAME_LENGTH = 100;

  private final FileStorage storage;
  private final ImageProcessor imageProcessor;
  private final DocumentValidator documentValidator;

  /** Stores a profile photo as a 512 px and a 128 px square JPEG. */
  @Transactional
  public AvatarFiles storeAvatar(UUID ownerId, MultipartFile upload) {
    byte[] bytes = read(upload, UploadLimits.MAX_IMAGE_BYTES, "Profile photo");
    FileSignature type = FileSignature.detect(bytes)
        .filter(FileSignature::isImage)
        .orElseThrow(() -> ApiException.badRequest(
            "UNSUPPORTED_IMAGE_TYPE", "Profile photo must be a JPEG, PNG or WebP image."));
    ImageProcessor.ProcessedAvatar avatar = imageProcessor.processAvatar(bytes, type);
    return new AvatarFiles(
        storage.store(ownerId, StoredFileKind.AVATAR, "image/jpeg", "avatar.jpg", avatar.full()),
        storage.store(ownerId, StoredFileKind.AVATAR_THUMB, "image/jpeg", "avatar-thumb.jpg", avatar.thumbnail()));
  }

  /** Stores a PDF or DOCX resume (compressed when that saves space). */
  @Transactional
  public StoredFileInfo storeResume(UUID ownerId, MultipartFile upload) {
    byte[] bytes = read(upload, UploadLimits.MAX_RESUME_BYTES, "Resume");
    FileSignature type = FileSignature.detect(bytes).orElse(null);
    String contentType;
    String extension;
    if (type == FileSignature.PDF) {
      documentValidator.validatePdf(bytes);
      contentType = DocumentValidator.PDF;
      extension = ".pdf";
    } else if (type == FileSignature.ZIP) {
      documentValidator.validateDocx(bytes);
      contentType = DocumentValidator.DOCX;
      extension = ".docx";
    } else {
      throw ApiException.badRequest("UNSUPPORTED_RESUME_TYPE", "Resume must be a PDF or a Word (.docx) document.");
    }
    String filename = safeFilename(upload.getOriginalFilename(), "resume", extension);
    return storage.store(ownerId, StoredFileKind.RESUME, contentType, filename, bytes);
  }

  public Optional<FileContent> open(UUID fileId) {
    return storage.load(fileId);
  }

  public Optional<StoredFileInfo> info(UUID fileId) {
    return storage.info(fileId);
  }

  @Transactional
  public void delete(UUID fileId) {
    storage.delete(fileId);
  }

  private static byte[] read(MultipartFile upload, int maxBytes, String label) {
    if (upload == null || upload.isEmpty()) {
      throw ApiException.badRequest("FILE_REQUIRED", label + " file is required.");
    }
    if (upload.getSize() > maxBytes) throw tooLarge(label, maxBytes);
    try (InputStream in = upload.getInputStream()) {
      byte[] bytes = in.readNBytes(maxBytes + 1);
      if (bytes.length > maxBytes) throw tooLarge(label, maxBytes);
      return bytes;
    } catch (IOException e) {
      throw ApiException.badRequest("UPLOAD_FAILED", "The upload was interrupted. Please try again.");
    }
  }

  private static ApiException tooLarge(String label, int maxBytes) {
    return new ApiException(
        HttpStatus.PAYLOAD_TOO_LARGE, "FILE_TOO_LARGE", label + " must be at most " + maxBytes / (1024 * 1024) + " MB.");
  }

  /**
   * Keeps a readable version of the client's file name for display and downloads: no path, only
   * safe characters, bounded length, and always the extension of the detected type.
   */
  static String safeFilename(String original, String fallbackBase, String extension) {
    String name = original == null ? "" : original.replace('\\', '/');
    name = name.substring(name.lastIndexOf('/') + 1);
    int dot = name.lastIndexOf('.');
    String base = (dot > 0 ? name.substring(0, dot) : name)
        .replaceAll("[^\\p{L}\\p{N} ._()-]", "_")
        .replaceAll("\\s+", " ")
        .strip();
    if (base.isEmpty() || base.chars().allMatch(c -> c == '.' || c == '_')) base = fallbackBase;
    int maxBase = MAX_FILENAME_LENGTH - extension.length();
    if (base.length() > maxBase) base = base.substring(0, maxBase).strip();
    return base + extension.toLowerCase(Locale.ROOT);
  }
}
