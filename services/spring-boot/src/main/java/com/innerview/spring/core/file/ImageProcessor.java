package com.innerview.spring.core.file;

import com.drew.imaging.ImageMetadataReader;
import com.drew.metadata.Metadata;
import com.drew.metadata.exif.ExifIFD0Directory;
import com.innerview.spring.exception.ApiException;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Iterator;
import javax.imageio.ImageIO;
import javax.imageio.ImageReadParam;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import net.coobird.thumbnailator.Thumbnails;
import net.coobird.thumbnailator.geometry.Positions;
import org.springframework.stereotype.Component;

/**
 * Turns an uploaded photo into the stored avatar: decoded (proving it really is an image), rotated
 * per its EXIF orientation, flattened onto white, center-cropped to a square and re-encoded as
 * JPEG in two sizes. Re-encoding drops all metadata (including GPS location) and anything hidden
 * in the original file, and shrinks a multi-megabyte photo to tens of kilobytes.
 */
@Component
public class ImageProcessor {
  public static final int FULL_SIZE = 512;
  public static final int THUMB_SIZE = 128;
  public static final int MIN_SIDE = 128;
  /** Header dimensions are checked before decoding, so decompression bombs are never decoded. */
  public static final long MAX_PIXELS = 100_000_000L;

  private static final float FULL_QUALITY = 0.85f;
  private static final float THUMB_QUALITY = 0.80f;

  public record ProcessedAvatar(byte[] full, byte[] thumbnail) {}

  public ProcessedAvatar processAvatar(byte[] bytes, FileSignature type) {
    if (!type.isImage()) throw unsupported();
    BufferedImage decoded = decode(bytes, type);
    BufferedImage upright = orientAndFlatten(decoded, readExifOrientation(bytes));
    int side = Math.min(upright.getWidth(), upright.getHeight());
    try {
      return new ProcessedAvatar(
          squareJpeg(upright, Math.min(FULL_SIZE, side), FULL_QUALITY),
          squareJpeg(upright, Math.min(THUMB_SIZE, side), THUMB_QUALITY));
    } catch (IOException e) {
      throw new IllegalStateException("Could not encode avatar", e);
    }
  }

  private static BufferedImage decode(byte[] bytes, FileSignature type) {
    try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
      Iterator<ImageReader> readers = ImageIO.getImageReadersByFormatName(formatName(type));
      if (!readers.hasNext()) throw new IllegalStateException("No ImageIO reader for " + type);
      ImageReader reader = readers.next();
      try {
        reader.setInput(input, true, true);
        int width = reader.getWidth(0);
        int height = reader.getHeight(0);
        if ((long) width * height > MAX_PIXELS) {
          throw ApiException.badRequest("IMAGE_TOO_LARGE", "This image's resolution is too high. Use a photo under 100 megapixels.");
        }
        if (Math.min(width, height) < MIN_SIDE) {
          throw ApiException.badRequest(
              "IMAGE_TOO_SMALL", "Profile photo must be at least " + MIN_SIDE + "×" + MIN_SIDE + " pixels.");
        }
        // Decode large photos at reduced resolution: we only need FULL_SIZE pixels on the short side.
        int subsampling = Math.max(1, Math.min(width, height) / (FULL_SIZE * 2));
        ImageReadParam param = reader.getDefaultReadParam();
        param.setSourceSubsampling(subsampling, subsampling, 0, 0);
        BufferedImage image = reader.read(0, param);
        if (image == null) throw invalidImage();
        return image;
      } finally {
        reader.dispose();
      }
    } catch (ApiException e) {
      throw e;
    } catch (IOException | RuntimeException e) {
      throw invalidImage();
    }
  }

  /** EXIF orientation (1–8); 1 when missing or unreadable. */
  private static int readExifOrientation(byte[] bytes) {
    try {
      Metadata metadata = ImageMetadataReader.readMetadata(new ByteArrayInputStream(bytes));
      ExifIFD0Directory exif = metadata.getFirstDirectoryOfType(ExifIFD0Directory.class);
      if (exif != null && exif.containsTag(ExifIFD0Directory.TAG_ORIENTATION)) {
        return exif.getInt(ExifIFD0Directory.TAG_ORIENTATION);
      }
    } catch (Exception ignored) {
      // Unreadable metadata is not a reason to reject an image that decoded fine.
    }
    return 1;
  }

  /** Applies an EXIF orientation and draws the result onto an opaque white RGB canvas. */
  static BufferedImage orientAndFlatten(BufferedImage src, int orientation) {
    int w = src.getWidth();
    int h = src.getHeight();
    // Affine matrices (m00, m10, m01, m11, m02, m12) mapping source pixels to the upright image.
    AffineTransform transform = switch (orientation) {
      case 2 -> new AffineTransform(-1, 0, 0, 1, w, 0); // mirror horizontally
      case 3 -> new AffineTransform(-1, 0, 0, -1, w, h); // rotate 180°
      case 4 -> new AffineTransform(1, 0, 0, -1, 0, h); // mirror vertically
      case 5 -> new AffineTransform(0, 1, 1, 0, 0, 0); // transpose
      case 6 -> new AffineTransform(0, 1, -1, 0, h, 0); // rotate 90° clockwise
      case 7 -> new AffineTransform(0, -1, -1, 0, h, w); // transverse
      case 8 -> new AffineTransform(0, -1, 1, 0, 0, w); // rotate 90° counter-clockwise
      default -> new AffineTransform();
    };
    boolean swapsSides = orientation >= 5 && orientation <= 8;
    BufferedImage out = new BufferedImage(swapsSides ? h : w, swapsSides ? w : h, BufferedImage.TYPE_INT_RGB);
    Graphics2D g = out.createGraphics();
    try {
      g.setColor(Color.WHITE);
      g.fillRect(0, 0, out.getWidth(), out.getHeight());
      g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
      g.drawImage(src, transform, null);
    } finally {
      g.dispose();
    }
    return out;
  }

  private static byte[] squareJpeg(BufferedImage image, int size, float quality) throws IOException {
    ByteArrayOutputStream out = new ByteArrayOutputStream();
    Thumbnails.of(image)
        .crop(Positions.CENTER)
        .size(size, size)
        .outputFormat("jpg")
        .outputQuality(quality)
        .toOutputStream(out);
    return out.toByteArray();
  }

  private static String formatName(FileSignature type) {
    return switch (type) {
      case JPEG -> "jpeg";
      case PNG -> "png";
      case WEBP -> "webp";
      default -> throw unsupported();
    };
  }

  private static ApiException invalidImage() {
    return ApiException.badRequest("INVALID_IMAGE", "This file couldn't be read as an image.");
  }

  private static ApiException unsupported() {
    return ApiException.badRequest("UNSUPPORTED_IMAGE_TYPE", "Profile photo must be a JPEG, PNG or WebP image.");
  }
}
