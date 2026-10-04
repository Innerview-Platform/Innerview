package com.innerview.spring.controller;

import com.innerview.spring.core.util.RateLimiter;
import com.innerview.spring.dto.profile.UsernameAvailabilityResponse;
import com.innerview.spring.service.impl.UsernameService;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Duration;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Live username checks for the sign-up and profile forms. Public, so it works before signing in. */
@RestController
@RequiredArgsConstructor
public class UsernameController {
  private final UsernameService usernameService;
  private final RateLimiter rateLimiter;

  @GetMapping("/api/auth/username-available")
  public ResponseEntity<UsernameAvailabilityResponse> isAvailable(
      @RequestParam String username,
      @AuthenticationPrincipal UUID currentUserId,
      HttpServletRequest request) {
    String client = currentUserId != null ? currentUserId.toString() : request.getRemoteAddr();
    rateLimiter.check("username-check:" + client, 60, Duration.ofMinutes(1), "Too many username checks — wait a moment.");
    return ResponseEntity.ok(usernameService.check(username, currentUserId));
  }
}
