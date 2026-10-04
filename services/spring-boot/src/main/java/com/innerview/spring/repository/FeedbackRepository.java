package com.innerview.spring.repository;

import com.innerview.spring.dto.review.ReviewRow;
import com.innerview.spring.entity.Feedback;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    java.util.List<Feedback> findByInterviewId(Long interviewId);

    boolean existsByInterviewIdAndReviewerIdAndRevieweeId(Long interviewId, UUID reviewerId, UUID revieweeId);


    /** Reviews about {@code userId}; the "person" is the reviewer. */
    @Query(value = """
        SELECT new com.innerview.spring.dto.review.ReviewRow(
            f.id, person.id, person.username, person.name, profile.avatarFileId, profile.avatarThumbFileId,
            profile.imageUrl, f.reviewerRole, f.rating, f.comment, f.hireSignal,
            i.id, i.title, i.type, i.startTime, f.createdAt)
        FROM Feedback f
        JOIN f.reviewer person
        JOIN f.interview i
        LEFT JOIN UserProfile profile ON profile.user = person
        WHERE f.reviewee.id = :userId
        AND (:rating IS NULL OR f.rating = :rating)
        ORDER BY f.createdAt DESC, f.id DESC
        """,
        countQuery = "SELECT COUNT(f) FROM Feedback f WHERE f.reviewee.id = :userId AND (:rating IS NULL OR f.rating = :rating)")
    Page<ReviewRow> findReviewsReceived(
            @Param("userId") UUID userId, @Param("rating") Integer rating, Pageable pageable);

    /** Reviews written by {@code userId}; the "person" is the reviewee. */
    @Query(value = """
        SELECT new com.innerview.spring.dto.review.ReviewRow(
            f.id, person.id, person.username, person.name, profile.avatarFileId, profile.avatarThumbFileId,
            profile.imageUrl, f.reviewerRole, f.rating, f.comment, f.hireSignal,
            i.id, i.title, i.type, i.startTime, f.createdAt)
        FROM Feedback f
        JOIN f.reviewee person
        JOIN f.interview i
        LEFT JOIN UserProfile profile ON profile.user = person
        WHERE f.reviewer.id = :userId
        ORDER BY f.createdAt DESC, f.id DESC
        """,
        countQuery = "SELECT COUNT(f) FROM Feedback f WHERE f.reviewer.id = :userId")
    Page<ReviewRow> findReviewsGiven(@Param("userId") UUID userId, Pageable pageable);

    /** One review about {@code userId} (empty when it isn't theirs). */
    @Query("""
        SELECT new com.innerview.spring.dto.review.ReviewRow(
            f.id, person.id, person.username, person.name, profile.avatarFileId, profile.avatarThumbFileId,
            profile.imageUrl, f.reviewerRole, f.rating, f.comment, f.hireSignal,
            i.id, i.title, i.type, i.startTime, f.createdAt)
        FROM Feedback f
        JOIN f.reviewer person
        JOIN f.interview i
        LEFT JOIN UserProfile profile ON profile.user = person
        WHERE f.id = :id AND f.reviewee.id = :userId
        """)
    java.util.Optional<ReviewRow> findReviewReceived(@Param("id") Long id, @Param("userId") UUID userId);

    /** One review written by {@code userId} (empty when it isn't theirs). */
    @Query("""
        SELECT new com.innerview.spring.dto.review.ReviewRow(
            f.id, person.id, person.username, person.name, profile.avatarFileId, profile.avatarThumbFileId,
            profile.imageUrl, f.reviewerRole, f.rating, f.comment, f.hireSignal,
            i.id, i.title, i.type, i.startTime, f.createdAt)
        FROM Feedback f
        JOIN f.reviewee person
        JOIN f.interview i
        LEFT JOIN UserProfile profile ON profile.user = person
        WHERE f.id = :id AND f.reviewer.id = :userId
        """)
    java.util.Optional<ReviewRow> findReviewGiven(@Param("id") Long id, @Param("userId") UUID userId);

    /** Reviews about a user (personal data removed when they delete their account). */
    @org.springframework.data.jpa.repository.Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM Feedback f WHERE f.reviewee.id = :userId")
    int deleteAllAbout(@Param("userId") UUID userId);
}
