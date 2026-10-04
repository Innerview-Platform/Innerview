package com.innerview.spring.dto.room;

public record TicketDto(String ticket, String role, boolean staff, boolean host, boolean readonly) {}
