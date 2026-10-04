package com.innerview.spring.repository;

import com.innerview.spring.dto.file.StoredFileInfo;
import com.innerview.spring.entity.StoredFile;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StoredFileRepository extends JpaRepository<StoredFile, UUID> {

  /** Metadata only — does not read the BLOB column. */
  @Query("""
      SELECT new com.innerview.spring.dto.file.StoredFileInfo(
          f.id, f.owner.id, f.kind, f.contentType, f.originalFilename, f.sizeOriginal, f.sha256, f.createdAt)
      FROM StoredFile f
      WHERE f.id = :id
      """)
  Optional<StoredFileInfo> findInfoById(@Param("id") UUID id);

  /** Deletes without loading the row (and its BLOB) first. */
  @Modifying(flushAutomatically = true, clearAutomatically = true)
  @Query("DELETE FROM StoredFile f WHERE f.id = :id")
  int deleteByIdWithoutLoading(@Param("id") UUID id);

  @Modifying(flushAutomatically = true, clearAutomatically = true)
  @Query("DELETE FROM StoredFile f WHERE f.owner.id = :ownerId")
  int deleteAllByOwner(@Param("ownerId") UUID ownerId);
}
