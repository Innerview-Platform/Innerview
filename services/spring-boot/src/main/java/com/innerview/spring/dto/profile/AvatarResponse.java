package com.innerview.spring.dto.profile;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

/** URLs of the uploaded profile photo (512 px and 128 px); both null when there is none. */
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record AvatarResponse(String avatarUrl, String avatarThumbUrl) {}
