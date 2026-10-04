package com.innerview.spring.core.file;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;

class FileSignatureTest {

  @Test
  void detectsSupportedFormatsByContent() throws Exception {
    assertThat(FileSignature.detect(TestFiles.png(10, 10))).contains(FileSignature.PNG);
    assertThat(FileSignature.detect(TestFiles.jpeg(10, 10))).contains(FileSignature.JPEG);
    assertThat(FileSignature.detect(TestFiles.pdf(1))).contains(FileSignature.PDF);
    assertThat(FileSignature.detect(TestFiles.docx())).contains(FileSignature.ZIP);
    byte[] webpHeader = "RIFF\0\0\0\0WEBPVP8 ".getBytes(StandardCharsets.US_ASCII);
    assertThat(FileSignature.detect(webpHeader)).contains(FileSignature.WEBP);
  }

  @Test
  void rejectsUnknownContentWhateverItIsCalled() {
    byte[] windowsExecutable = {'M', 'Z', (byte) 0x90, 0, 3, 0, 0, 0};
    assertThat(FileSignature.detect(windowsExecutable)).isEmpty();
    assertThat(FileSignature.detect("<svg onload=alert(1)>".getBytes(StandardCharsets.UTF_8))).isEmpty();
    assertThat(FileSignature.detect(new byte[0])).isEmpty();
    assertThat(FileSignature.detect("RIFF\0\0\0\0WAVE".getBytes(StandardCharsets.US_ASCII))).isEmpty();
  }
}
