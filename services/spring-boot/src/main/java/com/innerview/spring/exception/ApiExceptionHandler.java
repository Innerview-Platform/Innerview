package com.innerview.spring.exception;

import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@RestControllerAdvice
public class ApiExceptionHandler {

  /** Body: {"error": "human message", "code": "MACHINE_CODE"}. */
  @ExceptionHandler(ApiException.class)
  public ResponseEntity<Map<String, String>> handle(ApiException e) {
    return ResponseEntity.status(e.getStatus()).body(Map.of("error", e.getMessage(), "code", e.getCode()));
  }

  /** Uploads over spring.servlet.multipart.max-file-size are rejected before reaching a controller. */
  @ExceptionHandler(MaxUploadSizeExceededException.class)
  public ResponseEntity<Map<String, String>> handleUploadTooLarge(MaxUploadSizeExceededException e) {
    return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
        .body(Map.of("error", "The file is too large. The limit is 5 MB.", "code", "FILE_TOO_LARGE"));
  }
}
