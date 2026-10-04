package com.innerview.spring.service.impl;

import com.innerview.spring.core.file.DeflateCodec;
import com.innerview.spring.dto.file.FileContent;
import com.innerview.spring.dto.file.StoredFileInfo;
import com.innerview.spring.entity.StoredFile;
import com.innerview.spring.entity.User;
import com.innerview.spring.enums.StoredFileEncoding;
import com.innerview.spring.enums.StoredFileKind;
import com.innerview.spring.repository.StoredFileRepository;
import com.innerview.spring.service.FileStorage;
import jakarta.persistence.EntityManager;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Stores files as raw bytes in the {@code stored_files} table. Formats that are already compressed
 * (JPEG/PNG/WebP) are stored as-is; anything else is Deflate-compressed when that saves at least 10%.
 */
@Service
@RequiredArgsConstructor
public class DbFileStorage implements FileStorage {
  private final StoredFileRepository repository;
  private final EntityManager entityManager;

  @Override
  @Transactional
  public StoredFileInfo store(UUID ownerId, StoredFileKind kind, String contentType, String filename, byte[] bytes) {
    byte[] stored = bytes;
    StoredFileEncoding encoding = StoredFileEncoding.IDENTITY;
    if (!contentType.startsWith("image/")) {
      byte[] compressed = DeflateCodec.compress(bytes);
      if (DeflateCodec.worthIt(bytes.length, compressed.length)) {
        stored = compressed;
        encoding = StoredFileEncoding.DEFLATE;
      }
    }
    if (stored.length > StoredFile.MAX_STORED_BYTES) {
      throw new IllegalArgumentException("File too large to store: " + stored.length + " bytes");
    }

    StoredFile file = new StoredFile();
    file.setOwner(entityManager.getReference(User.class, ownerId));
    file.setKind(kind);
    file.setContentType(contentType);
    file.setOriginalFilename(filename);
    file.setSizeOriginal(bytes.length);
    file.setSizeStored(stored.length);
    file.setEncoding(encoding);
    file.setSha256(sha256(bytes));
    file.setData(stored);
    StoredFile saved = repository.saveAndFlush(file);
    return toInfo(saved, ownerId);
  }

  @Override
  @Transactional(readOnly = true)
  public Optional<StoredFileInfo> info(UUID fileId) {
    return repository.findInfoById(fileId);
  }

  @Override
  @Transactional(readOnly = true)
  public Optional<FileContent> load(UUID fileId) {
    return repository.findById(fileId).map(file -> {
      byte[] bytes = file.getEncoding() == StoredFileEncoding.DEFLATE
          ? DeflateCodec.decompress(file.getData(), file.getSizeOriginal())
          : file.getData();
      return new FileContent(toInfo(file, file.getOwner().getId()), bytes);
    });
  }

  @Override
  @Transactional
  public void delete(UUID fileId) {
    repository.deleteByIdWithoutLoading(fileId);
  }

  private static StoredFileInfo toInfo(StoredFile file, UUID ownerId) {
    return new StoredFileInfo(
        file.getId(), ownerId, file.getKind(), file.getContentType(), file.getOriginalFilename(),
        file.getSizeOriginal(), file.getSha256(), file.getCreatedAt());
  }

  static String sha256(byte[] bytes) {
    try {
      return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException(e);
    }
  }
}
