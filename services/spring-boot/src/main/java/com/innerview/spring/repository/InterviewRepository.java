package com.innerview.spring.repository;

import com.innerview.spring.entity.Interview;
import com.innerview.spring.enums.InterviewStatus;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, Long> {

    /** Scheduled interviews whose start time falls between from and to (inclusive) — used to fire reminders. */
    List<Interview> findByStatusAndStartTimeBetween(InterviewStatus status, Instant from, Instant to);

    List<Interview> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);

    Interview getInterviewsByRoomId(String roomId);

    @Query("""
            select distinct i
            from Interview i
            left join fetch i.problems
            where i.id = :id
            """)
    Optional<Interview> findByIdWithProblems(@Param("id") Long id);

    Optional<Interview> findByRoomId(String roomId);

    List<Interview> findByStatusAndEndTimeBefore(InterviewStatus status, Instant time);

    List<Interview> findByStatusAndStartTimeBefore(InterviewStatus status, Instant time);

    // Status transitions are compare-and-set: the WHERE re-checks the state at write time, so of two
    // racing requests exactly one changes the row (returns 1) and the other gets 0 instead of
    // overwriting it. They clear the persistence context, so entities loaded earlier are detached
    // and can't be flushed back over the new state.

    /** SCHEDULED and never entered → {@code status} (CANCELLED or GHOSTED). */
    @Transactional
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            update Interview i set i.status = :status
            where i.id = :id
              and i.status = com.innerview.spring.enums.InterviewStatus.SCHEDULED
              and i.liveSince is null
            """)
    int endIfNeverStarted(@Param("id") Long id, @Param("status") InterviewStatus status);

    /** First entry, or a room reopened after a restart: only while not cancelled or ended. */
    @Transactional
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            update Interview i
            set i.status = com.innerview.spring.enums.InterviewStatus.STARTED,
                i.liveSince = :liveSince,
                i.endTime = :endTime
            where i.id = :id
              and i.status in (com.innerview.spring.enums.InterviewStatus.SCHEDULED,
                               com.innerview.spring.enums.InterviewStatus.STARTED)
            """)
    int markLiveIfNotEnded(@Param("id") Long id, @Param("liveSince") Instant liveSince, @Param("endTime") Instant endTime);
}
