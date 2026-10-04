package com.innerview.spring.core.util;

import com.innerview.spring.exception.ApiException;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Username format: 3–30 characters of lowercase letters, digits, '.', '_' and '-', starting and
 * ending with a letter or digit, with no two separators in a row. Input is lowercased, so
 * usernames are unique regardless of case.
 */
public final class UsernameRules {
  public static final int MIN_LENGTH = 3;
  public static final int MAX_LENGTH = 30;

  private static final Pattern FORMAT = Pattern.compile("^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$");
  private static final Pattern REPEATED_SEPARATORS = Pattern.compile("[._-]{2}");

  /** Would clash with routes such as /api/profile/me or /u/settings, or impersonate staff. */
  private static final Set<String> RESERVED = Set.of(
      "me", "admin", "administrator", "api", "app", "auth", "canvas", "collab", "dashboard", "feedback",
      "help", "innerview", "interview", "interviews", "join", "languages", "login", "logout", "moderator",
      "new", "null", "profile", "register", "root", "settings", "signin", "signup", "support", "system",
      "u", "undefined", "user", "users", "ws-signal");

  private UsernameRules() {}

  public static String normalize(String raw) {
    return raw == null ? "" : raw.strip().toLowerCase(Locale.ROOT);
  }

  /** Why a (normalized) username is not allowed, or empty when the format is fine. */
  public static Optional<String> formatProblem(String username) {
    if (username.length() < MIN_LENGTH || username.length() > MAX_LENGTH) {
      return Optional.of("Username must be " + MIN_LENGTH + "–" + MAX_LENGTH + " characters.");
    }
    if (!FORMAT.matcher(username).matches()) {
      return Optional.of("Use lowercase letters, numbers, '.', '_' or '-', starting and ending with a letter or number.");
    }
    if (REPEATED_SEPARATORS.matcher(username).find()) {
      return Optional.of("Username can't have two '.', '_' or '-' in a row.");
    }
    if (RESERVED.contains(username)) {
      return Optional.of("This username is reserved.");
    }
    return Optional.empty();
  }

  /** The normalized username, or a 400 explaining what is wrong with it. */
  public static String validate(String raw) {
    String username = normalize(raw);
    formatProblem(username).ifPresent(problem -> {
      throw ApiException.badRequest("INVALID_USERNAME", problem);
    });
    return username;
  }
}
