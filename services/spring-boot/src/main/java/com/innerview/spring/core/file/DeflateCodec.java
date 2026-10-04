package com.innerview.spring.core.file;

import java.io.ByteArrayOutputStream;
import java.util.zip.DataFormatException;
import java.util.zip.Deflater;
import java.util.zip.Inflater;

/** Raw-bytes Deflate compression for stored files. */
public final class DeflateCodec {
  /** Compressed output is kept only when it is at most this fraction of the original. */
  public static final double MAX_RATIO = 0.90;

  private DeflateCodec() {}

  public static byte[] compress(byte[] input) {
    Deflater deflater = new Deflater(Deflater.BEST_COMPRESSION);
    try {
      deflater.setInput(input);
      deflater.finish();
      ByteArrayOutputStream out = new ByteArrayOutputStream(Math.max(64, input.length / 2));
      byte[] buffer = new byte[16 * 1024];
      while (!deflater.finished()) {
        out.write(buffer, 0, deflater.deflate(buffer));
      }
      return out.toByteArray();
    } finally {
      deflater.end();
    }
  }

  public static boolean worthIt(int originalSize, int compressedSize) {
    return compressedSize <= originalSize * MAX_RATIO;
  }

  /**
   * Inflates data that must decompress to exactly {@code expectedSize} bytes (stored alongside it),
   * so corrupt rows fail loudly and can never expand into more memory than recorded.
   */
  public static byte[] decompress(byte[] input, int expectedSize) {
    Inflater inflater = new Inflater();
    try {
      inflater.setInput(input);
      byte[] out = new byte[expectedSize + 1];
      int length = 0;
      while (!inflater.finished()) {
        int n = inflater.inflate(out, length, out.length - length);
        if (n == 0 && !inflater.finished()) {
          if (length == out.length) throw new IllegalStateException("Stored file is larger than recorded");
          throw new IllegalStateException("Stored file data is truncated");
        }
        length += n;
      }
      if (length != expectedSize) {
        throw new IllegalStateException("Stored file size mismatch: expected " + expectedSize + ", got " + length);
      }
      return java.util.Arrays.copyOf(out, expectedSize);
    } catch (DataFormatException e) {
      throw new IllegalStateException("Stored file data is corrupt", e);
    } finally {
      inflater.end();
    }
  }
}
