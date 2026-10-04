package com.innerview.spring.service.redis;

import com.innerview.spring.enums.InterviewEndReason;
import com.innerview.spring.enums.InterviewStatus;
import com.innerview.spring.repository.InterviewRepository;
import com.innerview.spring.service.RoomService;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.stereotype.Component;

/**
 * Compatibility listener for legacy interview:<id> expiry events. The database
 * scheduler remains authoritative; this path uses the same idempotent room end
 * operation and ignores timers from before an extension or scheduling change.
 */
@Component
@RequiredArgsConstructor
public class RedisExpirationListner implements MessageListener {

  private final RoomService roomService;
  private final InterviewRepository interviewRepository;

  @Override
  public void onMessage(Message message, byte[] pattern) {
    String expiredKey = message.toString();
    if (!expiredKey.matches("interview:[0-9]+")) return;
    final long interviewId;
    try {
      interviewId = Long.parseLong(expiredKey.substring("interview:".length()));
    } catch (NumberFormatException malformedId) {
      return;
    }
    interviewRepository.findById(interviewId)
        .filter(interview -> interview.getStatus() == InterviewStatus.STARTED)
        .filter(interview -> interview.getEndTime() != null && !interview.getEndTime().isAfter(Instant.now()))
        .ifPresent(interview -> roomService.endInterview(interview, InterviewEndReason.TIME_UP));
  }
}
