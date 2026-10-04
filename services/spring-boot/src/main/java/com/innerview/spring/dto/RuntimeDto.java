package com.innerview.spring.dto;

import java.util.List;

/** A language runtime installed in Piston (GET /api/v2/runtimes). */
public record RuntimeDto(String language, String version, List<String> aliases) {
}
