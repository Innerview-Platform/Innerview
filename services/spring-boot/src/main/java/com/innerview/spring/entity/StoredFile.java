package com.innerview.spring.entity;

import com.innerview.spring.enums.StoredFileEncoding;
import com.innerview.spring.enums.StoredFileKind;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

/**
 * An uploaded file (profile photo, resume) kept in MySQL. Profiles only reference these rows by id,
 * so loading a profile never loads file bytes. Bytes are stored raw (never Base64), compressed with
 * Deflate only when that saves space — see {@code DbFileStorage}.
 */
@Entity
@Table(name = "stored_files", indexes = @Index(name = "idx_stored_files_owner_kind", columnList = "owner_id, kind"))
@Getter
@Setter
@NoArgsConstructor
public class StoredFile {
  /** Fits in MEDIUMBLOB, which Hibernate picks for this length on MySQL. */
  public static final int MAX_STORED_BYTES = 16_777_215;

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "owner_id", nullable = false)
  private User owner;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private StoredFileKind kind;

  @Column(name = "content_type", nullable = false, length = 100)
  private String contentType;

  @Column(name = "original_filename", length = 255)
  private String originalFilename;

  @Column(name = "size_original", nullable = false)
  private int sizeOriginal;

  @Column(name = "size_stored", nullable = false)
  private int sizeStored;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 10)
  private StoredFileEncoding encoding;

  /** Hex SHA-256 of the original bytes; doubles as the HTTP ETag. */
  @Column(nullable = false, length = 64)
  private String sha256;

  @Lob
  @Column(nullable = false, length = MAX_STORED_BYTES)
  private byte[] data;

  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;
}
