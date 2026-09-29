package com.innerview.spring.core.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Small, idempotent schema fixes that {@code ddl-auto: update} can't do on existing databases
 * (Hibernate adds new columns but never changes an existing column's type).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SchemaPatches implements ApplicationRunner {

  private final JdbcTemplate jdbcTemplate;

  @Override
  public void run(ApplicationArguments args) {
    // Was ENUM('BOTH','INTERVIEWEE','INTERVIEWER'); OBSERVER was added to InterviewRole.
    patch("ALTER TABLE user_interview MODIFY COLUMN role VARCHAR(20) NOT NULL");
  }

  private void patch(String sql) {
    try {
      jdbcTemplate.execute(sql);
    } catch (Exception e) {
      log.warn("[Schema] Skipped patch ({}): {}", sql, e.getMessage());
    }
  }
}
