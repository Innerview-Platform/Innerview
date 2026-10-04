package com.innerview.spring.core.file;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Random;
import org.junit.jupiter.api.Test;

class DeflateCodecTest {

  @Test
  void roundTripsAndShrinksRepetitiveData() {
    byte[] original = "Senior Software Engineer at InnerView. ".repeat(2_000).getBytes(StandardCharsets.UTF_8);
    byte[] compressed = DeflateCodec.compress(original);

    assertThat(DeflateCodec.worthIt(original.length, compressed.length)).isTrue();
    assertThat(DeflateCodec.decompress(compressed, original.length)).isEqualTo(original);
  }

  @Test
  void randomDataIsNotWorthCompressing() {
    byte[] random = new byte[50_000];
    new Random(42).nextBytes(random);
    assertThat(DeflateCodec.worthIt(random.length, DeflateCodec.compress(random).length)).isFalse();
  }

  @Test
  void rejectsSizeMismatchAndCorruptData() {
    byte[] original = "abc".repeat(1_000).getBytes(StandardCharsets.UTF_8);
    byte[] compressed = DeflateCodec.compress(original);

    assertThatThrownBy(() -> DeflateCodec.decompress(compressed, original.length - 1))
        .isInstanceOf(IllegalStateException.class);
    assertThatThrownBy(() -> DeflateCodec.decompress(compressed, original.length + 1))
        .isInstanceOf(IllegalStateException.class);
    assertThatThrownBy(() -> DeflateCodec.decompress(Arrays.copyOf(compressed, compressed.length / 2), original.length))
        .isInstanceOf(IllegalStateException.class);
    assertThatThrownBy(() -> DeflateCodec.decompress(new byte[] {1, 2, 3, 4}, 10))
        .isInstanceOf(IllegalStateException.class);
  }
}
