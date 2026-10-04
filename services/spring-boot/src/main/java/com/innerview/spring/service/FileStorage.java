package com.innerview.spring.service;

import com.innerview.spring.dto.file.FileContent;
import com.innerview.spring.dto.file.StoredFileInfo;
import com.innerview.spring.enums.StoredFileKind;
import java.util.Optional;
import java.util.UUID;

/**
 * Where uploaded file bytes live. {@code DbFileStorage} keeps them in MySQL; an S3/MinIO
 * implementation can replace it without changing callers. Callers pass already-validated bytes
 * (see {@code FileUploadService}).
 */
public interface FileStorage {

  StoredFileInfo store(UUID ownerId, StoredFileKind kind, String contentType, String filename, byte[] bytes);

  /** Metadata only, without reading the bytes. */
  Optional<StoredFileInfo> info(UUID fileId);

  /** The original (decompressed) bytes. */
  Optional<FileContent> load(UUID fileId);

  void delete(UUID fileId);
}
