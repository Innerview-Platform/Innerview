package com.innerview.spring.core.handler;

import com.innerview.spring.entity.User;
import com.innerview.spring.repository.UserRepository;
import com.innerview.spring.service.RefreshTokenService;
import com.innerview.spring.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
  /** A Duration, so lifetimes past ~24 days don't overflow (an int of milliseconds did). */
  @Value("${jwt.refresh-token.expiration}")
  Duration refreshTokenExpiry;

  @Value("${frontend.url}")
  private String frontendUrl;

  private final UserService userService;

  private final UserRepository userRepository;
  private final RefreshTokenService tokenService;

  public OAuth2SuccessHandler(
      UserService userService, UserRepository userRepository, RefreshTokenService tokenService) {
    this.userService = userService;
    this.userRepository = userRepository;
    this.tokenService = tokenService;
  }

  @Override
  public void onAuthenticationSuccess(
      HttpServletRequest request, HttpServletResponse response, Authentication authentication)
      throws IOException {
    OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();
    String email = oauthUser.getAttribute("email");
    String name = oauthUser.getAttribute("name");
    String providerId = oauthUser.getAttribute("sub");
    String refreshToken;
    String accessToken;
    Optional<User> user = userRepository.findByProviderId(providerId);
    // if he is logging back with his google account
    if (user.isPresent()) {
      refreshToken = tokenService.createRefreshToken(user.get()).getToken();
      accessToken = tokenService.createAccessToken(user.get());
    } else {
      user = userRepository.findByEmail(email);
      // in case he he is logging back but registerd with normal email and password not by google
      if (user.isPresent()) {
        refreshToken = tokenService.createRefreshToken(user.get()).getToken();
        accessToken = tokenService.createAccessToken(user.get());
        // we need to link the local account with google provider id
        User modifiedUser = user.get();
        modifiedUser.setProviderId(providerId);
        userRepository.save(modifiedUser);
      } else {
        // first time user visiting the website
        User newUser =
            User.builder()
                .authProvider("Google")
                .providerId(providerId)
                // Google can omit the display name; the column is required.
                .name(name != null && !name.isBlank() ? name : email.substring(0, email.indexOf('@')))
                .email(email)
                .passwordHash(null)
                .build();
        User savedUser = userRepository.save(newUser);
        refreshToken = tokenService.createRefreshToken(savedUser).getToken();
        accessToken = tokenService.createAccessToken(savedUser);
      }
    }
    // The SPA can't read httpOnly cookies, so only the refresh token is set; the app exchanges it
    // for an access token via POST /api/auth/refresh as soon as it loads (?signin=google).
    response.addHeader(
        "Set-Cookie",
        org.springframework.http.ResponseCookie.from("refresh_token", refreshToken)
            .httpOnly(true)
            .secure(frontendUrl.startsWith("https://"))
            .path("/api/auth")
            .maxAge(refreshTokenExpiry)
            .sameSite("Lax")
            .build()
            .toString());
    response.sendRedirect(frontendUrl + "/?signin=google");
  }
}
