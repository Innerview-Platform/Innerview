package com.innerview.spring.core.file;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.innerview.spring.exception.ApiException;
import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.util.Arrays;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;

class ImageProcessorTest {
  private final ImageProcessor processor = new ImageProcessor();

  @Test
  void producesSquareJpegsInBothSizes() throws Exception {
    ImageProcessor.ProcessedAvatar avatar = processor.processAvatar(TestFiles.png(1600, 900), FileSignature.PNG);

    assertThat(FileSignature.detect(avatar.full())).contains(FileSignature.JPEG);
    BufferedImage full = ImageIO.read(new ByteArrayInputStream(avatar.full()));
    BufferedImage thumb = ImageIO.read(new ByteArrayInputStream(avatar.thumbnail()));
    assertThat(full.getWidth()).isEqualTo(512);
    assertThat(full.getHeight()).isEqualTo(512);
    assertThat(thumb.getWidth()).isEqualTo(128);
    assertThat(thumb.getHeight()).isEqualTo(128);
  }

  @Test
  void flattensTransparencyOntoWhite() throws Exception {
    // The test PNG's right half is transparent; after a center crop that is the right edge.
    ImageProcessor.ProcessedAvatar avatar = processor.processAvatar(TestFiles.png(600, 600), FileSignature.PNG);
    BufferedImage full = ImageIO.read(new ByteArrayInputStream(avatar.full()));
    Color right = new Color(full.getRGB(500, 256));
    Color left = new Color(full.getRGB(10, 256));
    assertThat(right.getRed()).isGreaterThan(240);
    assertThat(right.getGreen()).isGreaterThan(240);
    assertThat(left.getRed()).isGreaterThan(200);
    assertThat(left.getGreen()).isLessThan(60);
  }

  @Test
  void keepsSmallImagesAtTheirOwnSize() throws Exception {
    ImageProcessor.ProcessedAvatar avatar = processor.processAvatar(TestFiles.jpeg(300, 200), FileSignature.JPEG);
    assertThat(ImageIO.read(new ByteArrayInputStream(avatar.full())).getWidth()).isEqualTo(200);
  }

  @Test
  void rejectsTooSmallImages() throws Exception {
    assertThatThrownBy(() -> processor.processAvatar(TestFiles.png(64, 64), FileSignature.PNG))
        .isInstanceOf(ApiException.class)
        .extracting("code").isEqualTo("IMAGE_TOO_SMALL");
  }

  @Test
  void rejectsDecompressionBombsFromTheHeaderAlone() {
    assertThatThrownBy(() -> processor.processAvatar(TestFiles.pngHeaderOnly(30_000, 30_000), FileSignature.PNG))
        .isInstanceOf(ApiException.class)
        .extracting("code").isEqualTo("IMAGE_TOO_LARGE");
  }

  @Test
  void rejectsFilesThatOnlyLookLikeImages() throws Exception {
    byte[] png = TestFiles.png(400, 400);
    byte[] truncated = Arrays.copyOf(png, 60);
    assertThatThrownBy(() -> processor.processAvatar(truncated, FileSignature.PNG))
        .isInstanceOf(ApiException.class)
        .extracting("code").isEqualTo("INVALID_IMAGE");
  }

  @Test
  void webpReaderIsAvailable() {
    assertThat(ImageIO.getImageReadersByFormatName("webp").hasNext()).isTrue();
  }

  @Test
  void appliesExifOrientation() {
    // 4×2 image with a red pixel at the top-left corner.
    BufferedImage src = new BufferedImage(4, 2, BufferedImage.TYPE_INT_RGB);
    src.setRGB(0, 0, Color.RED.getRGB());

    assertRedAt(ImageProcessor.orientAndFlatten(src, 1), 4, 2, 0, 0);
    assertRedAt(ImageProcessor.orientAndFlatten(src, 2), 4, 2, 3, 0);
    assertRedAt(ImageProcessor.orientAndFlatten(src, 3), 4, 2, 3, 1);
    assertRedAt(ImageProcessor.orientAndFlatten(src, 4), 4, 2, 0, 1);
    assertRedAt(ImageProcessor.orientAndFlatten(src, 5), 2, 4, 0, 0);
    assertRedAt(ImageProcessor.orientAndFlatten(src, 6), 2, 4, 1, 0);
    assertRedAt(ImageProcessor.orientAndFlatten(src, 7), 2, 4, 1, 3);
    assertRedAt(ImageProcessor.orientAndFlatten(src, 8), 2, 4, 0, 3);
  }

  private static void assertRedAt(BufferedImage image, int width, int height, int x, int y) {
    assertThat(image.getWidth()).isEqualTo(width);
    assertThat(image.getHeight()).isEqualTo(height);
    assertThat(new Color(image.getRGB(x, y))).isEqualTo(Color.RED);
  }
}
