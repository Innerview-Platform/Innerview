package com.innerview.spring.repository;

import com.innerview.spring.dto.stats.RatingTotal;
import com.innerview.spring.dto.stats.RoleCount;
import com.innerview.spring.entity.UserStats;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserStatsRepository extends JpaRepository<UserStats, UUID> {

  @Query("""
      SELECT new com.innerview.spring.dto.stats.RatingTotal(f.reviewee.id, SUM(f.rating), COUNT(f))
      FROM Feedback f WHERE f.reviewee.id IN :userIds GROUP BY f.reviewee.id
      """)
  List<RatingTotal> ratingTotals(@Param("userIds") Collection<UUID> userIds);

  @Query("""
      SELECT new com.innerview.spring.dto.stats.RoleCount(ui.user.id, ui.role, COUNT(ui))
      FROM UserInterview ui
      WHERE ui.user.id IN :userIds
      AND ui.interview.status = com.innerview.spring.enums.InterviewStatus.COMPLETED
      GROUP BY ui.user.id, ui.role
      """)
  List<RoleCount> completedInterviewsByRole(@Param("userIds") Collection<UUID> userIds);

  @Query("SELECT u.id FROM User u")
  List<UUID> allUserIds();
}
