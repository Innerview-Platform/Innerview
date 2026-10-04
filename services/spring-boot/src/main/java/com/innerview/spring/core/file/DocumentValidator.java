package com.innerview.spring.core.file;

import com.innerview.spring.exception.ApiException;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDDocumentCatalog;
import org.apache.pdfbox.pdmodel.encryption.InvalidPasswordException;
import org.apache.pdfbox.pdmodel.interactive.action.PDActionJavaScript;
import org.springframework.stereotype.Component;

/**
 * Checks that an uploaded resume really is a readable PDF or DOCX, not just a file with the right
 * first bytes. Files are only inspected, never extracted or executed.
 */
@Component
public class DocumentValidator {
  public static final String PDF = "application/pdf";
  public static final String DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  static final int MAX_PDF_PAGES = 50;
  static final int MAX_ZIP_ENTRIES = 1_000;
  /** A 5 MB DOCX that inflates past this is a zip bomb. */
  static final long MAX_ZIP_UNCOMPRESSED_BYTES = 100L * 1024 * 1024;
  private static final int MAX_CONTENT_TYPES_BYTES = 1024 * 1024;

  private static final String DOCX_MAIN_PART = "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml";

  public void validatePdf(byte[] bytes) {
    // PDFs that need a password to open throw InvalidPasswordException. Owner-password-only
    // ("secured", common from resume builders) PDFs open normally and are accepted.
    try (PDDocument document = Loader.loadPDF(bytes)) {
      int pages = document.getNumberOfPages();
      if (pages == 0) throw invalid("PDF has no pages.");
      if (pages > MAX_PDF_PAGES) {
        throw ApiException.badRequest("RESUME_TOO_LONG", "Resume must be at most " + MAX_PDF_PAGES + " pages.");
      }
      if (hasDocumentJavaScript(document.getDocumentCatalog())) {
        throw ApiException.badRequest("RESUME_HAS_SCRIPTS", "PDFs with embedded JavaScript aren't allowed.");
      }
    } catch (InvalidPasswordException e) {
      throw passwordProtected();
    } catch (IOException e) {
      throw invalid("This file couldn't be read as a PDF.");
    }
  }

  private static boolean hasDocumentJavaScript(PDDocumentCatalog catalog) throws IOException {
    if (catalog.getOpenAction() instanceof PDActionJavaScript) return true;
    return catalog.getNames() != null && catalog.getNames().getJavaScript() != null;
  }

  /**
   * A DOCX is a ZIP whose [Content_Types].xml declares a WordprocessingML main document. Rejects
   * macro-enabled documents (.docm, vbaProject.bin), other Office/ZIP files and zip bombs.
   */
  public void validateDocx(byte[] bytes) {
    boolean hasDocument = false;
    String contentTypes = null;
    long uncompressed = 0;
    int entries = 0;
    try (ZipInputStream zip = new ZipInputStream(new ByteArrayInputStream(bytes))) {
      byte[] buffer = new byte[16 * 1024];
      ZipEntry entry;
      while ((entry = zip.getNextEntry()) != null) {
        if (++entries > MAX_ZIP_ENTRIES) throw invalid("This file couldn't be read as a Word document.");
        String name = entry.getName();
        if (name.toLowerCase(Locale.ROOT).endsWith("vbaproject.bin")) throw macros();
        if (name.equals("word/document.xml")) hasDocument = true;
        ByteArrayOutputStream captured = name.equals("[Content_Types].xml") ? new ByteArrayOutputStream() : null;
        int n;
        while ((n = zip.read(buffer)) > 0) {
          uncompressed += n;
          if (uncompressed > MAX_ZIP_UNCOMPRESSED_BYTES) throw invalid("This Word document is too large when unpacked.");
          if (captured != null) {
            if (captured.size() + n > MAX_CONTENT_TYPES_BYTES) throw invalid("This file couldn't be read as a Word document.");
            captured.write(buffer, 0, n);
          }
        }
        if (captured != null) contentTypes = captured.toString(StandardCharsets.UTF_8);
      }
    } catch (ApiException e) {
      throw e;
    } catch (IOException | IllegalArgumentException e) {
      throw invalid("This file couldn't be read as a Word document.");
    }
    if (contentTypes == null || !hasDocument) throw invalid("This file couldn't be read as a Word document.");
    if (contentTypes.toLowerCase(Locale.ROOT).contains("macroenabled")) throw macros();
    if (!contentTypes.contains(DOCX_MAIN_PART)) throw invalid("Only .docx Word documents are supported.");
  }

  private static ApiException invalid(String message) {
    return ApiException.badRequest("INVALID_RESUME", message);
  }

  private static ApiException passwordProtected() {
    return ApiException.badRequest("RESUME_ENCRYPTED", "Password-protected PDFs aren't supported. Remove the password and upload again.");
  }

  private static ApiException macros() {
    return ApiException.badRequest("RESUME_HAS_MACROS", "Word documents with macros aren't allowed. Save it as a regular .docx.");
  }
}
