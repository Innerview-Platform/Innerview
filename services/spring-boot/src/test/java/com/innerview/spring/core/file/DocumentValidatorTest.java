package com.innerview.spring.core.file;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.innerview.spring.exception.ApiException;
import java.util.Map;
import org.junit.jupiter.api.Test;

class DocumentValidatorTest {
  private final DocumentValidator validator = new DocumentValidator();

  @Test
  void acceptsARegularPdf() throws Exception {
    assertThatCode(() -> validator.validatePdf(TestFiles.pdf(2))).doesNotThrowAnyException();
    // Owner-password-only ("secured") PDFs open without a password.
    assertThatCode(() -> validator.validatePdf(TestFiles.encryptedPdf(""))).doesNotThrowAnyException();
  }

  @Test
  void rejectsBrokenEncryptedOrScriptedPdfs() throws Exception {
    assertCode(() -> validator.validatePdf("%PDF-1.7 not really".getBytes()), "INVALID_RESUME");
    assertCode(() -> validator.validatePdf(TestFiles.encryptedPdf("open-me")), "RESUME_ENCRYPTED");
    assertCode(() -> validator.validatePdf(TestFiles.pdfWithJavaScript()), "RESUME_HAS_SCRIPTS");
    assertCode(() -> validator.validatePdf(TestFiles.pdf(DocumentValidator.MAX_PDF_PAGES + 1)), "RESUME_TOO_LONG");
  }

  @Test
  void acceptsARegularDocx() throws Exception {
    assertThatCode(() -> validator.validateDocx(TestFiles.docx())).doesNotThrowAnyException();
  }

  @Test
  void rejectsMacrosOtherZipsAndOtherOfficeFiles() throws Exception {
    assertCode(() -> validator.validateDocx(TestFiles.zip(Map.of(
        "[Content_Types].xml", TestFiles.DOCX_CONTENT_TYPES,
        "word/document.xml", "<w:document/>",
        "word/vbaProject.bin", "macro"))), "RESUME_HAS_MACROS");
    assertCode(() -> validator.validateDocx(TestFiles.zip(Map.of(
        "[Content_Types].xml", TestFiles.DOCX_CONTENT_TYPES.replace(
            "officedocument.wordprocessingml.document.main+xml", "ms-word.document.macroEnabled.main+xml"),
        "word/document.xml", "<w:document/>"))), "RESUME_HAS_MACROS");
    assertCode(() -> validator.validateDocx(TestFiles.zip(Map.of("photo.jpg", "x"))), "INVALID_RESUME");
    assertCode(() -> validator.validateDocx(TestFiles.zip(Map.of(
        "[Content_Types].xml", "<Types/>", "word/document.xml", "<w:document/>"))), "INVALID_RESUME");
  }

  @Test
  void rejectsZipBombs() throws Exception {
    String huge = "0".repeat(1024 * 1024);
    Map<String, String> entries = new java.util.HashMap<>();
    entries.put("[Content_Types].xml", TestFiles.DOCX_CONTENT_TYPES);
    entries.put("word/document.xml", "<w:document/>");
    for (int i = 0; i < 110; i++) entries.put("word/media/pad" + i + ".txt", huge);
    byte[] bomb = TestFiles.zip(entries);
    assertThatThrownBy(() -> validator.validateDocx(bomb)).isInstanceOf(ApiException.class).hasMessageContaining("unpacked");
  }

  private static void assertCode(org.assertj.core.api.ThrowableAssert.ThrowingCallable call, String code) {
    assertThatThrownBy(call).isInstanceOf(ApiException.class).extracting("code").isEqualTo(code);
  }
}
