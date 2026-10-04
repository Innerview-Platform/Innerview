package com.innerview.spring.dto.stats;

import com.innerview.spring.enums.InterviewRole;
import java.util.UUID;

public record RoleCount(UUID userId, InterviewRole role, Long count) {}
