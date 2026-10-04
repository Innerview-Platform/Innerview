package com.innerview.spring.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.innerview.spring.core.file.DocumentValidator;
import com.innerview.spring.core.file.ImageProcessor;
import com.innerview.spring.core.file.TestFiles;
import com.innerview.spring.core.file.UploadLimits;
import com.innerview.spring.dto.file.AvatarFiles;
import com.innerview.spring.dto.file.FileContent;
import com.innerview.spring.dto.file.StoredFileInfo;
import com.innerview.spring.enums.StoredFileKind;
import com.innerview.spring.exception.ApiException;
import com.innerview.spring.service.FileStorage;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;

class FileUploadServiceTest {
  private final InMemoryStorage storage = new InMemoryStorage();
  private final FileUploadService service = new FileUploadService(storage, new ImageProcessor(), new DocumentValidator());
  private final UUID owner = UUID.randomUUID();

  @Test
  void storesAvatarInTwoSizes() throws Exception {
    AvatarFiles files = service.storeAvatar(owner, upload("me.png", "image/png", TestFiles.png(1200, 1200)));

    assertThat(files.full().kind()).isEqualTo(StoredFileKind.AVATAR);
    assertThat(files.thumbnail().kind()).isEqualTo(StoredFileKind.AVATAR_THUMB);
    assertThat(files.full().contentType()).isEqualTo("image/jpeg");
    assertThat(files.full().size()).isLessThan(TestFiles.png(1200, 1200).length);
    assertThat(storage.files).hasSize(2);
  }

  @Test
  void ignoresTheClaimedTypeAndNameOfAnUpload() {
    byte[] executable = {'M', 'Z', (byte) 0x90, 0, 3, 0, 0, 0, 4, 0};
    assertCode(() -> service.storeAvatar(owner, upload("cat.jpg", "image/jpeg", executable)), "UNSUPPORTED_IMAGE_TYPE");
    assertCode(() -> service.storeResume(owner, upload("cv.pdf", "application/pdf", executable)), "UNSUPPORTED_RESUME_TYPE");
    assertThat(storage.files).isEmpty();
  }

  @Test
  void rejectsAPdfUploadedAsAPhoto() throws Exception {
    assertCode(() -> service.storeAvatar(owner, upload("me.jpg", "image/jpeg", TestFiles.pdf(1))), "UNSUPPORTED_IMAGE_TYPE");
  }

  @Test
  void rejectsEmptyAndOversizedUploads() {
    assertCode(() -> service.storeAvatar(owner, upload("me.png", "image/png", new byte[0])), "FILE_REQUIRED");
    byte[] tooBig = new byte[UploadLimits.MAX_RESUME_BYTES + 1];
    assertThatThrownBy(() -> service.storeResume(owner, upload("cv.pdf", "application/pdf", tooBig)))
        .isInstanceOf(ApiException.class)
        .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.PAYLOAD_TOO_LARGE));
  }

  @Test
  void storesPdfAndDocxResumesWithDetectedTypeAndSafeName() throws Exception {
    byte[] pdfBytes = TestFiles.pdf(1);
    StoredFileInfo pdf = service.storeResume(owner, upload("../../etc/My CV <final>.PDF", "text/plain", pdfBytes));
    assertThat(pdf.contentType()).isEqualTo(DocumentValidator.PDF);
    assertThat(pdf.originalFilename()).isEqualTo("My CV _final_.pdf");

    StoredFileInfo docx = service.storeResume(owner, upload("resume.pdf", "application/pdf", TestFiles.docx()));
    assertThat(docx.contentType()).isEqualTo(DocumentValidator.DOCX);
    assertThat(docx.originalFilename()).isEqualTo("resume.docx");

    assertThat(service.open(pdf.id()).orElseThrow().bytes()).isEqualTo(pdfBytes);
  }

  @Test
  void sanitizesFilenames() {
    assertThat(FileUploadService.safeFilename(null, "resume", ".pdf")).isEqualTo("resume.pdf");
    assertThat(FileUploadService.safeFilename("C:\\Users\\me\\CV.docx", "resume", ".docx")).isEqualTo("CV.docx");
    assertThat(FileUploadService.safeFilename("...", "resume", ".pdf")).isEqualTo("resume.pdf");
    assertThat(FileUploadService.safeFilename("سيرة ذاتية.pdf", "resume", ".pdf")).isEqualTo("سيرة ذاتية.pdf");
    assertThat(FileUploadService.safeFilename("a".repeat(300) + ".pdf", "resume", ".pdf")).hasSize(100);
  }

  private static MockMultipartFile upload(String name, String contentType, byte[] bytes) {
    return new MockMultipartFile("file", name, contentType, bytes);
  }

  private static void assertCode(org.assertj.core.api.ThrowableAssert.ThrowingCallable call, String code) {
    assertThatThrownBy(call).isInstanceOf(ApiException.class).extracting("code").isEqualTo(code);
  }

  /** Keeps files in a map so the service can be tested without a database. */
  static class InMemoryStorage implements FileStorage {
    final Map<UUID, FileContent> files = new HashMap<>();

    @Override
    public StoredFileInfo store(UUID ownerId, StoredFileKind kind, String contentType, String filename, byte[] bytes) {
      StoredFileInfo info = new StoredFileInfo(
          UUID.randomUUID(), ownerId, kind, contentType, filename, bytes.length, "sha", LocalDateTime.now());
      files.put(info.id(), new FileContent(info, bytes));
      return info;
    }

    @Override
    public Optional<StoredFileInfo> info(UUID fileId) {
      return Optional.ofNullable(files.get(fileId)).map(FileContent::info);
    }

    @Override
    public Optional<FileContent> load(UUID fileId) {
      return Optional.ofNullable(files.get(fileId));
    }

    @Override
    public void delete(UUID fileId) {
      files.remove(fileId);
    }
  }
}
