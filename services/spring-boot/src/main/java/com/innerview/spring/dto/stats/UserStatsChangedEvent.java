package com.innerview.spring.dto.stats;

import java.util.Set;
import java.util.UUID;

/** Published when a review or a completed interview changes these users' profile numbers. */
public record UserStatsChangedEvent(Set<UUID> userIds) {}
