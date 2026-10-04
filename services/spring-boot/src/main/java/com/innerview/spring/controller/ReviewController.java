package com.innerview.spring.controller;

import com.innerview.spring.dto.review.ReviewDetailDto;
import com.innerview.spring.dto.review.ReviewSummaryDto;
import com.innerview.spring.service.impl.ReviewService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** The signed-in user's reviews. There is deliberately no endpoint for another user's reviews. */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/profile/me/reviews")
public class ReviewController {
  private final ReviewService reviewService;

  /** Reviews about me, newest first; optional exact {@code rating} filter. */
  @GetMapping
  public ResponseEntity<Page<ReviewSummaryDto>> received(
      @AuthenticationPrincipal UUID currentUserId,
      @RequestParam(required = false) Integer rating,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "12") int size) {
    return ResponseEntity.ok(reviewService.received(currentUserId, rating, page, size));
  }

  /** Reviews I wrote, newest first. */
  @GetMapping("/given")
  public ResponseEntity<Page<ReviewSummaryDto>> given(
      @AuthenticationPrincipal UUID currentUserId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "12") int size) {
    return ResponseEntity.ok(reviewService.given(currentUserId, page, size));
  }

  @GetMapping("/{reviewId}")
  public ResponseEntity<ReviewDetailDto> detail(@AuthenticationPrincipal UUID currentUserId, @PathVariable Long reviewId) {
    return ResponseEntity.ok(reviewService.detail(currentUserId, reviewId));
  }
}
