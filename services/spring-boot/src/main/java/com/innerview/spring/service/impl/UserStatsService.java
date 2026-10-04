package com.innerview.spring.service.impl;

import com.innerview.spring.dto.stats.RatingTotal;
import com.innerview.spring.dto.stats.RoleCount;
import com.innerview.spring.dto.stats.UserStatsChangedEvent;
import com.innerview.spring.entity.UserStats;
import com.innerview.spring.enums.InterviewRole;
import com.innerview.spring.repository.UserStatsRepository;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Keeps user_stats in sync. Each refresh recomputes a user's numbers from the source tables with two
 * grouped queries, so missed or repeated events can't leave wrong totals behind.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserStatsService {
  private static final int BATCH_SIZE = 500;

  private final UserStatsRepository repository;
  private final TransactionTemplate transactions;

  /** Runs after the review/interview transaction commits, so the new rows are visible. */
  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void onStatsChanged(UserStatsChangedEvent event) {
    try {
      recompute(event.userIds());
    } catch (Exception e) {
      // Never fail the caller; the nightly refresh repairs anything missed here.
      log.error("[UserStats] Refresh failed for {}", event.userIds(), e);
    }
  }

  @Transactional
  public void recompute(Collection<UUID> userIds) {
    if (userIds.isEmpty()) return;
    Map<UUID, UserStats> stats = repository.findAllById(userIds).stream()
        .collect(Collectors.toMap(UserStats::getUserId, Function.identity()));
    for (UUID userId : userIds) {
      UserStats row = stats.computeIfAbsent(userId, UserStats::new);
      row.setRatingSum(0);
      row.setRatingCount(0);
      row.setCompletedInterviews(0);
      row.setInterviewsAsCandidate(0);
      row.setInterviewsAsInterviewer(0);
    }
    for (RatingTotal total : repository.ratingTotals(userIds)) {
      UserStats row = stats.get(total.userId());
      row.setRatingSum(total.ratingSum());
      row.setRatingCount(total.ratingCount());
    }
    for (RoleCount count : repository.completedInterviewsByRole(userIds)) {
      UserStats row = stats.get(count.userId());
      long n = count.count();
      if (count.role() == InterviewRole.OBSERVER) continue;
      row.setCompletedInterviews(row.getCompletedInterviews() + n);
      if (count.role() == InterviewRole.INTERVIEWEE || count.role() == InterviewRole.BOTH) {
        row.setInterviewsAsCandidate(row.getInterviewsAsCandidate() + n);
      }
      if (count.role() == InterviewRole.INTERVIEWER || count.role() == InterviewRole.BOTH) {
        row.setInterviewsAsInterviewer(row.getInterviewsAsInterviewer() + n);
      }
    }
    repository.saveAll(stats.values());
  }

  /** Backfills every user on startup (fills the table the first time) and repairs drift nightly. */
  @Async
  @EventListener(ApplicationReadyEvent.class)
  @Scheduled(cron = "0 30 3 * * *")
  public void recomputeAll() {
    List<UUID> ids = repository.allUserIds();
    for (int from = 0; from < ids.size(); from += BATCH_SIZE) {
      recomputeBatch(new ArrayList<>(ids.subList(from, Math.min(from + BATCH_SIZE, ids.size()))));
    }
    log.info("[UserStats] Refreshed {} users", ids.size());
  }

  private void recomputeBatch(List<UUID> ids) {
    try {
      // Self-invocation skips the @Transactional proxy, so open the transaction explicitly.
      transactions.executeWithoutResult(status -> recompute(ids));
    } catch (Exception e) {
      log.error("[UserStats] Batch refresh failed", e);
    }
  }

  @Transactional(readOnly = true)
  public UserStats statsFor(UUID userId) {
    return repository.findById(userId).orElseGet(() -> new UserStats(userId));
  }
}
