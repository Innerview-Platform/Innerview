package com.innerview.spring.dto.file;

import com.innerview.spring.enums.StoredFileKind;
import java.time.LocalDateTime;
import java.util.UUID;

/** A stored file's metadata, without its bytes. */
public record StoredFileInfo(
    UUID id,
    UUID ownerId,
    StoredFileKind kind,
    String contentType,
    String originalFilename,
    int size,
    String sha256,
    LocalDateTime createdAt) {}
