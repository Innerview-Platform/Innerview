package com.innerview.spring.controller;

import com.innerview.spring.dto.RuntimeDto;
import com.innerview.spring.service.CodeRunnerService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClientException;

/** Languages the shared editor can run. Running itself happens over STOMP (RUN_CODE). */
@RestController
@RequestMapping("/api/code-runner")
@RequiredArgsConstructor
public class CodeRunnerController {

  private final CodeRunnerService codeRunnerService;

  @GetMapping("/runtimes")
  public ResponseEntity<List<RuntimeDto>> getRuntimes() {
    try {
      return ResponseEntity.ok(codeRunnerService.listRuntimes());
    } catch (RestClientException e) {
      return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(List.of());
    }
  }
}
