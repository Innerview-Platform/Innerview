package com.innerview.spring.core.file;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Optional;

/**
 * Identifies an upload by its leading "magic" bytes. The file name and the client's Content-Type
 * are never trusted. This is only the first gate: each format is then fully decoded or parsed
 * ({@link ImageProcessor}, {@link DocumentValidator}).
 */
public enum FileSignature {
  JPEG,
  PNG,
  WEBP,
  PDF,
  /** A ZIP container; DOCX is one (checked by {@link DocumentValidator#validateDocx}). */
  ZIP;

  private static final byte[] PNG_MAGIC = {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n'};

  public boolean isImage() {
    return this == JPEG || this == PNG || this == WEBP;
  }

  public static Optional<FileSignature> detect(byte[] b) {
    if (startsWith(b, 0, new byte[] {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF})) return Optional.of(JPEG);
    if (startsWith(b, 0, PNG_MAGIC)) return Optional.of(PNG);
    if (startsWith(b, 0, ascii("RIFF")) && startsWith(b, 8, ascii("WEBP"))) return Optional.of(WEBP);
    if (startsWith(b, 0, ascii("%PDF-"))) return Optional.of(PDF);
    if (startsWith(b, 0, new byte[] {'P', 'K', 3, 4})) return Optional.of(ZIP);
    return Optional.empty();
  }

  private static boolean startsWith(byte[] b, int offset, byte[] prefix) {
    return b.length >= offset + prefix.length
        && Arrays.equals(b, offset, offset + prefix.length, prefix, 0, prefix.length);
  }

  private static byte[] ascii(String s) {
    return s.getBytes(StandardCharsets.US_ASCII);
  }
}
