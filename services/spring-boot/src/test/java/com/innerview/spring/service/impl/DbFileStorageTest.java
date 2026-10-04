package com.innerview.spring.service.impl;

import static org.assertj.core.api.Assertions.assertThat;

import com.innerview.spring.dto.file.StoredFileInfo;
import com.innerview.spring.entity.StoredFile;
import com.innerview.spring.entity.User;
import com.innerview.spring.enums.StoredFileEncoding;
import com.innerview.spring.enums.StoredFileKind;
import com.innerview.spring.repository.StoredFileRepository;
import com.innerview.spring.repository.UserRepository;
import java.nio.charset.StandardCharsets;
import java.util.Random;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

@DataJpaTest
@Import(DbFileStorage.class)
class DbFileStorageTest {
  @Autowired DbFileStorage storage;
  @Autowired StoredFileRepository repository;
  @Autowired UserRepository users;

  private UUID ownerId;

  @BeforeEach
  void createOwner() {
    User user = new User();
    user.setName("Owner");
    user.setEmail("owner-" + UUID.randomUUID() + "@example.com");
    user.setPasswordHash("hash");
    user.setForgotPasswordCount(0);
    ownerId = users.saveAndFlush(user).getId();
  }

  @Test
  void compressesDocumentsWhenItSavesSpaceAndRestoresTheOriginal() {
    byte[] resume = "Experience: Java, Spring Boot, MySQL. ".repeat(5_000).getBytes(StandardCharsets.UTF_8);

    StoredFileInfo info = storage.store(ownerId, StoredFileKind.RESUME, "application/pdf", "cv.pdf", resume);

    StoredFile row = repository.findById(info.id()).orElseThrow();
    assertThat(row.getEncoding()).isEqualTo(StoredFileEncoding.DEFLATE);
    assertThat(row.getSizeStored()).isLessThan(resume.length / 10);
    assertThat(storage.load(info.id()).orElseThrow().bytes()).isEqualTo(resume);
    assertThat(info.sha256()).hasSize(64);
    assertThat(info.ownerId()).isEqualTo(ownerId);
  }

  @Test
  void keepsIncompressibleAndImageDataAsIs() {
    byte[] random = new byte[20_000];
    new Random(7).nextBytes(random);
    byte[] repetitiveImage = new byte[20_000];

    StoredFileInfo doc = storage.store(ownerId, StoredFileKind.RESUME, "application/pdf", "cv.pdf", random);
    StoredFileInfo image = storage.store(ownerId, StoredFileKind.AVATAR, "image/jpeg", "avatar.jpg", repetitiveImage);

    assertThat(repository.findById(doc.id()).orElseThrow().getEncoding()).isEqualTo(StoredFileEncoding.IDENTITY);
    assertThat(repository.findById(image.id()).orElseThrow().getEncoding()).isEqualTo(StoredFileEncoding.IDENTITY);
    assertThat(storage.load(doc.id()).orElseThrow().bytes()).isEqualTo(random);
  }

  @Test
  void readsMetadataWithoutBytesAndDeletes() {
    StoredFileInfo stored = storage.store(ownerId, StoredFileKind.RESUME, "application/pdf", "cv.pdf", new byte[] {1, 2, 3});

    assertThat(storage.info(stored.id())).hasValueSatisfying(info -> {
      assertThat(info.originalFilename()).isEqualTo("cv.pdf");
      assertThat(info.size()).isEqualTo(3);
    });

    storage.delete(stored.id());
    assertThat(storage.load(stored.id())).isEmpty();
  }

  /**
   * Regression: the delete is a bulk JPQL query, which bypasses Hibernate's persistence context. Without
   * clearing it, a file loaded earlier in the same transaction was still returned after being deleted
   * (e.g. replacing an avatar, then reading the profile in the same request).
   */
  @Test
  void aDeletedFileIsGoneEvenIfItWasLoadedEarlierInTheSameTransaction() {
    StoredFileInfo stored = storage.store(ownerId, StoredFileKind.AVATAR, "image/jpeg", "a.jpg", new byte[] {9, 9});
    assertThat(storage.load(stored.id())).isPresent(); // now cached in the persistence context

    storage.delete(stored.id());

    assertThat(storage.load(stored.id())).isEmpty();
    assertThat(storage.info(stored.id())).isEmpty();
    assertThat(repository.existsById(stored.id())).isFalse();
  }
}
