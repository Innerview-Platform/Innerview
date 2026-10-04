package com.innerview.spring.repository;

import com.innerview.spring.entity.InterviewInvite;
import com.innerview.spring.enums.InviteStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InterviewInviteRepository extends JpaRepository<InterviewInvite, Long> {
  List<InterviewInvite> findByInterviewIdAndStatusNot(Long interviewId, InviteStatus status);

  Optional<InterviewInvite> findByInterviewIdAndEmailIgnoreCase(Long interviewId, String email);

  List<InterviewInvite> findByEmailIgnoreCaseAndStatusNot(String email, InviteStatus status);
}
