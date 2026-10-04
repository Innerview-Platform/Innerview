package com.innerview.spring.core.file;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.zip.CRC32;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import javax.imageio.ImageIO;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.encryption.AccessPermission;
import org.apache.pdfbox.pdmodel.encryption.StandardProtectionPolicy;
import org.apache.pdfbox.pdmodel.interactive.action.PDActionJavaScript;

/** Builds real (and deliberately broken) upload files for tests. */
public final class TestFiles {
  public static final String DOCX_CONTENT_TYPES = """
      <?xml version="1.0" encoding="UTF-8"?>
      <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
        <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
      </Types>""";

  private TestFiles() {}

  /** A PNG whose left half is red and right half transparent. */
  public static byte[] png(int width, int height) throws IOException {
    BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
    Graphics2D g = image.createGraphics();
    g.setColor(Color.RED);
    g.fillRect(0, 0, width / 2, height);
    g.dispose();
    return encode(image, "png");
  }

  public static byte[] jpeg(int width, int height) throws IOException {
    BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
    Graphics2D g = image.createGraphics();
    g.setColor(Color.BLUE);
    g.fillRect(0, 0, width, height);
    g.dispose();
    return encode(image, "jpg");
  }

  /** Just a PNG signature and an IHDR chunk claiming the given size — what a decompression bomb looks like up front. */
  public static byte[] pngHeaderOnly(int width, int height) {
    ByteBuffer ihdr = ByteBuffer.allocate(17).put("IHDR".getBytes(StandardCharsets.US_ASCII))
        .putInt(width).putInt(height).put((byte) 8).put((byte) 6).put((byte) 0).put((byte) 0).put((byte) 0);
    CRC32 crc = new CRC32();
    crc.update(ihdr.array());
    return ByteBuffer.allocate(8 + 4 + 17 + 4)
        .put(new byte[] {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n'})
        .putInt(13).put(ihdr.array()).putInt((int) crc.getValue())
        .array();
  }

  public static byte[] pdf(int pages) throws IOException {
    try (PDDocument document = new PDDocument()) {
      for (int i = 0; i < pages; i++) document.addPage(new PDPage());
      return save(document);
    }
  }

  public static byte[] encryptedPdf(String userPassword) throws IOException {
    try (PDDocument document = new PDDocument()) {
      document.addPage(new PDPage());
      StandardProtectionPolicy policy = new StandardProtectionPolicy("owner-secret", userPassword, new AccessPermission());
      policy.setEncryptionKeyLength(128);
      document.protect(policy);
      return save(document);
    }
  }

  public static byte[] pdfWithJavaScript() throws IOException {
    try (PDDocument document = new PDDocument()) {
      document.addPage(new PDPage());
      document.getDocumentCatalog().setOpenAction(new PDActionJavaScript("app.alert('hi')"));
      return save(document);
    }
  }

  public static byte[] docx() throws IOException {
    return zip(Map.of("[Content_Types].xml", DOCX_CONTENT_TYPES, "word/document.xml", "<w:document/>"));
  }

  public static byte[] zip(Map<String, String> entries) throws IOException {
    ByteArrayOutputStream out = new ByteArrayOutputStream();
    try (ZipOutputStream zip = new ZipOutputStream(out)) {
      for (Map.Entry<String, String> entry : entries.entrySet()) {
        zip.putNextEntry(new ZipEntry(entry.getKey()));
        zip.write(entry.getValue().getBytes(StandardCharsets.UTF_8));
        zip.closeEntry();
      }
    }
    return out.toByteArray();
  }

  private static byte[] encode(BufferedImage image, String format) throws IOException {
    ByteArrayOutputStream out = new ByteArrayOutputStream();
    ImageIO.write(image, format, out);
    return out.toByteArray();
  }

  private static byte[] save(PDDocument document) throws IOException {
    ByteArrayOutputStream out = new ByteArrayOutputStream();
    document.save(out);
    return out.toByteArray();
  }
}
