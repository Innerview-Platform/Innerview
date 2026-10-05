package com.innerview.spring.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import com.innerview.spring.core.handler.OAuth2SuccessHandler;
import com.innerview.spring.entity.RefreshToken;
import com.innerview.spring.entity.User;
import com.innerview.spring.repository.UserRepository;
import jakarta.servlet.http.Cookie;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OAuth2SuccessHandlerTest {

	@Mock
	private UserRepository userRepository;

	@Mock
	private RefreshTokenService tokenService;

	@Mock
	private Authentication authentication;

	@Mock
	private OAuth2User oAuth2User;

	@InjectMocks
	private OAuth2SuccessHandler successHandler;

	private MockHttpServletRequest request;
	private MockHttpServletResponse response;

	// Dummy data
	private final String email = "test@example.com";
	private final String name = "Test User";
	private final String providerId = "google-12345";
	private final String mockAccessToken = "mock.access.token";
	private final String mockRefreshTokenString = "mock.refresh.token";

	@BeforeEach
	void setUp() {
		request = new MockHttpServletRequest();
		response = new MockHttpServletResponse();
		ReflectionTestUtils.setField(successHandler, "frontendUrl", "/api/auth");
		// Normally injected from jwt.refresh-token.expiration.
		ReflectionTestUtils.setField(successHandler, "refreshTokenExpiry", java.time.Duration.ofDays(7));
		// Mock the OAuth2User attributes
		when(authentication.getPrincipal()).thenReturn(oAuth2User);
		when(oAuth2User.getAttribute("email")).thenReturn(email);
		when(oAuth2User.getAttribute("name")).thenReturn(name);
		when(oAuth2User.getAttribute("sub")).thenReturn(providerId);
	}

	@Test
	void onAuthenticationSuccess_ExistingGoogleUser_ShouldGenerateTokensAndRedirect()
			throws IOException {
		// Arrange
		User existingUser = User.builder().email(email).providerId(providerId).build();
		when(userRepository.findByProviderId(providerId)).thenReturn(Optional.of(existingUser));

		setupTokenServiceMocks(existingUser);

		// Act
		successHandler.onAuthenticationSuccess(request, response, authentication);

		// Then
		verify(userRepository, never()).findByEmail(any());
		verify(userRepository, never()).save(any());
		assertCookiesAndRedirect();
	}

	@Test
	void onAuthenticationSuccess_ExistingLocalUser_ShouldLinkAccountGenerateTokensAndRedirect()
			throws IOException {
		// Arrange
		User existingLocalUser = User.builder().email(email).passwordHash("hashedPwd").build();
		when(userRepository.findByProviderId(providerId)).thenReturn(Optional.empty());
		when(userRepository.findByEmail(email)).thenReturn(Optional.of(existingLocalUser));

		setupTokenServiceMocks(existingLocalUser);

		// Act
		successHandler.onAuthenticationSuccess(request, response, authentication);

		// Then
		ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
		verify(userRepository).save(userCaptor.capture());

		User savedUser = userCaptor.getValue();
		assertEquals(providerId, savedUser.getProviderId()); // Verify account linking

		assertCookiesAndRedirect();
	}

	@Test
	void onAuthenticationSuccess_NewUser_ShouldCreateUserGenerateTokensAndRedirect()
			throws IOException {
		// Arrange
		when(userRepository.findByProviderId(providerId)).thenReturn(Optional.empty());
		when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

		User newlySavedUser =
				User.builder()
						.email(email)
						.providerId(providerId)
						.name(name)
						.authProvider("Google")
						.build();
		when(userRepository.save(any(User.class))).thenReturn(newlySavedUser);

		setupTokenServiceMocks(newlySavedUser);

		// Act
		successHandler.onAuthenticationSuccess(request, response, authentication);

		// Then
		ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
		verify(userRepository).save(userCaptor.capture());

		User savedUser = userCaptor.getValue();
		assertEquals("Google", savedUser.getAuthProvider());
		assertEquals(email, savedUser.getEmail());
		assertEquals(providerId, savedUser.getProviderId());

		assertCookiesAndRedirect();
	}

	// Helpers

	private void setupTokenServiceMocks(User user) {
		RefreshToken mockRefreshTokenObj = mock(RefreshToken.class);
		when(mockRefreshTokenObj.getToken()).thenReturn(mockRefreshTokenString);

		when(tokenService.createRefreshToken(user)).thenReturn(mockRefreshTokenObj);
		when(tokenService.createAccessToken(user)).thenReturn(mockAccessToken);
	}

	private void assertCookiesAndRedirect() {
		// 1. Back to the SPA, which exchanges the refresh cookie for an access token.
		assertEquals("/api/auth/?signin=google", response.getRedirectedUrl());

		// 2. Only the httpOnly refresh cookie is set (the SPA can't read an access-token cookie anyway).
		String setCookie = response.getHeader("Set-Cookie");
		assertNotNull(setCookie);
		assertTrue(setCookie.startsWith("refresh_token=" + mockRefreshTokenString));
		assertTrue(setCookie.contains("HttpOnly"));
		assertTrue(setCookie.contains("Path=/api/auth"));
	}

	private Cookie getCookieByName(Cookie[] cookies, String name) {
		for (Cookie cookie : cookies) {
			if (name.equals(cookie.getName())) {
				return cookie;
			}
		}
		return null;
	}
}
