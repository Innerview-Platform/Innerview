package com.innerview.spring.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.innerview.spring.enums.EmploymentStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RegisterRequest {
	@NotBlank(message = "Email can't be empty")
	@Email(
			message = "Invalid Email Format",
			regexp = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$")
	private String email;

	/** Public handle; format and uniqueness are checked in UsernameService. */
	@NotBlank(message = "Username is required")
	@Size(max = 30, message = "Username must be at most 30 characters")
	private String username;

	@NotBlank(message = "Name is required")
	@Size(min = 3, message = "Name must be at least 3 characters long")
	private String name;

	@NotBlank(message = "Password is required")
	@Size(min = 8, message = "Password must be at least 8 characters long")
	@Pattern(
			regexp = "^(?=.*[A-Z])(?=.*\\d)(?=.*[^a-zA-Z0-9]).{8,}$",
			message = "Password must contain at least one uppercase letter, one number, and one special character"
	)
	private String password;

	@NotBlank(message = "Confirm password can't be empty")
	@JsonProperty("password_confirmation")
	private String passwordConfirmation;

	// ── Professional profile (created with the account; everything but the resume is required) ──

	@NotNull(message = "Employment status is required")
	@JsonProperty("employment_status")
	private EmploymentStatus employmentStatus;

	/** Required when employment_status is EMPLOYED (checked in the service). */
	@Size(max = 100, message = "Company must be at most 100 characters")
	private String company;

	@NotBlank(message = "University is required")
	@Size(max = 150, message = "University must be at most 150 characters")
	private String university;

	@NotBlank(message = "College is required")
	@Size(max = 150, message = "College must be at most 150 characters")
	private String college;

	@Size(max = 120, message = "Headline must be at most 120 characters")
	private String headline;
}
