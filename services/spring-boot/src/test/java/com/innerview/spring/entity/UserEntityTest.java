package com.innerview.spring.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class UserEntityTest {

	/** User.builder() must keep the field defaults; forgot_password_count is NOT NULL in the database. */
	@Test
	void builder_ShouldApplyFieldDefaults() {
		User user = User.builder().email("test@example.com").name("Test User").build();
		assertEquals("local", user.getAuthProvider());
		assertEquals(0, user.getForgotPasswordCount());
	}
}
