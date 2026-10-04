package com.innerview.spring.repository;

import com.innerview.spring.entity.InterviewMessage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InterviewMessageRepository extends JpaRepository<InterviewMessage, Long> {
  List<InterviewMessage> findByInterviewIdOrderBySentAtAsc(Long interviewId);
}
