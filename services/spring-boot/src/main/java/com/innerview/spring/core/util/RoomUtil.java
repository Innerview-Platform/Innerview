package com.innerview.spring.core.util;

import java.security.SecureRandom;
import java.util.Locale;
import java.util.function.Predicate;

/**
 * Interview room codes, Google Meet style: 10 lowercase letters shown as {@code abc-defg-hij}.
 *
 * <p>Codes are stored canonical (lowercase, no separators) and matched after {@link #canonical}, so
 * "ABC-defg-HIJ", "abcdefghij" and "abc defg hij" are the same room. Older 6-character mixed-case
 * codes keep working because they are canonicalized the same way on both sides.
 */
public final class RoomUtil {

  private static final String LETTERS = "abcdefghijklmnopqrstuvwxyz";
  private static final int CODE_LENGTH = 10;
  private static final SecureRandom RANDOM = new SecureRandom();

  private RoomUtil() {}

  /** A new code that {@code taken} reports as unused (26^10 ≈ 1.4e14 possibilities). */
  public static String generateUniqueRoomId(Predicate<String> taken) {
    for (int attempt = 0; attempt < 20; attempt++) {
      String code = randomCode();
      if (!taken.test(code)) return code;
    }
    throw new IllegalStateException("Could not generate a unique room code");
  }

  static String randomCode() {
    StringBuilder code = new StringBuilder(CODE_LENGTH);
    for (int i = 0; i < CODE_LENGTH; i++) code.append(LETTERS.charAt(RANDOM.nextInt(LETTERS.length())));
    return code.toString();
  }

  /** Lowercase, letters and digits only; null for input that can't be a code. */
  public static String canonical(String input) {
    if (input == null) return null;
    String code = input.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    return code.isEmpty() || code.length() > 32 ? null : code;
  }

  /** Display form: "abc-defg-hij" for 10-letter codes, unchanged otherwise. */
  public static String format(String code) {
    if (code == null || code.length() != CODE_LENGTH) return code;
    return code.substring(0, 3) + "-" + code.substring(3, 7) + "-" + code.substring(7);
  }
}
