package com.innerview.spring.dto.room;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

/** Invite people by email; role is INTERVIEWER, INTERVIEWEE or OBSERVER. */
public record InviteRequest(@NotEmpty @Size(max = 20) List<@Valid Invitee> invitees) {
  public record Invitee(@NotBlank @Email String email, @NotBlank String role) {}
}
