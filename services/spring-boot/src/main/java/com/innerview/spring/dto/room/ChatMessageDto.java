package com.innerview.spring.dto.room;

import java.time.Instant;
import java.util.UUID;

public record ChatMessageDto(Long id, UUID senderId, String senderName, String text, Instant sentAt) {}
