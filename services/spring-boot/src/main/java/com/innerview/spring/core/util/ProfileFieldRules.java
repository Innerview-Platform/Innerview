package com.innerview.spring.core.util;

import com.innerview.spring.entity.UserProfile;
import com.innerview.spring.enums.EmploymentStatus;
import com.innerview.spring.exception.ApiException;
import java.net.URI;
import java.net.URISyntaxException;
import java.time.DateTimeException;
import java.time.ZoneId;
import java.util.Locale;

/** Normalization and cross-field checks for profile fields, shared by sign-up and profile edits. */
public final class ProfileFieldRules {
  private ProfileFieldRules() {}

  /** Trimmed text, or null when blank. */
  public static String optional(String value) {
    if (value == null) return null;
    String trimmed = value.strip().replaceAll("\\s+", " ");
    return trimmed.isEmpty() ? null : trimmed;
  }

  public static String required(String value, String label) {
    String text = optional(value);
    if (text == null) throw ApiException.badRequest("FIELD_REQUIRED", label + " is required.");
    return text;
  }

  /** Sets status and company together: a company is required when employed and dropped otherwise. */
  public static void applyEmployment(UserProfile profile, EmploymentStatus status, String company) {
    if (status == null) throw ApiException.badRequest("FIELD_REQUIRED", "Employment status is required.");
    profile.setEmploymentStatus(status);
    profile.setCompany(status == EmploymentStatus.EMPLOYED ? required(company, "Company") : null);
  }

  /** An https URL, optionally restricted to a site (e.g. "linkedin.com" also allows www.linkedin.com). */
  public static String httpsUrl(String value, String label, String requiredSite) {
    String text = optional(value);
    if (text == null) return null;
    if (!text.matches("(?i)^https?://.*")) text = "https://" + text;
    try {
      URI uri = new URI(text);
      String host = uri.getHost() == null ? null : uri.getHost().toLowerCase(Locale.ROOT);
      if (!"https".equalsIgnoreCase(uri.getScheme()) || host == null || !host.contains(".") || uri.getUserInfo() != null) {
        throw invalidUrl(label);
      }
      if (requiredSite != null && !(host.equals(requiredSite) || host.endsWith("." + requiredSite))) {
        throw ApiException.badRequest("INVALID_URL", label + " must be a " + requiredSite + " link.");
      }
      return uri.toString();
    } catch (URISyntaxException e) {
      throw invalidUrl(label);
    }
  }

  /** An IANA time zone id such as "Africa/Cairo". */
  public static String timezone(String value) {
    String text = optional(value);
    if (text == null) return null;
    try {
      return ZoneId.of(text).getId();
    } catch (DateTimeException e) {
      throw ApiException.badRequest("INVALID_TIMEZONE", "Unknown time zone: " + text);
    }
  }

  private static ApiException invalidUrl(String label) {
    return ApiException.badRequest("INVALID_URL", label + " must be a valid https:// link.");
  }
}
