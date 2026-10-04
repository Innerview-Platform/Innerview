package com.innerview.spring.core.util;

import com.innerview.spring.exception.ApiException;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Fixed-window rate limiting per key, in memory (the backend runs as a single instance).
 * Used for code lookups (stops code guessing), knocks, code runs and chat messages.
 */
@Component
public class RateLimiter {

  private record Window(long startedAt, int count) {}

  private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

  /** Counts one hit; false when {@code key} already used {@code limit} hits in the current window. */
  public boolean tryAcquire(String key, int limit, Duration window) {
    long now = System.currentTimeMillis();
    Window updated =
        windows.compute(
            key,
            (k, current) ->
                current == null || now - current.startedAt() >= window.toMillis()
                    ? new Window(now, 1)
                    : new Window(current.startedAt(), current.count() + 1));
    return updated.count() <= limit;
  }

  /** Like {@link #tryAcquire} but throws a 429 {@link ApiException}. */
  public void check(String key, int limit, Duration window, String message) {
    if (!tryAcquire(key, limit, window)) throw ApiException.tooManyRequests(message);
  }

  @Scheduled(fixedDelay = 600_000)
  void evictOldWindows() {
    long cutoff = System.currentTimeMillis() - Duration.ofHours(1).toMillis();
    windows.entrySet().removeIf(entry -> entry.getValue().startedAt() < cutoff);
  }
}
