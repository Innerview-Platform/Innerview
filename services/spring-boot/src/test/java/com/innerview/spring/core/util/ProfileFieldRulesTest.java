package com.innerview.spring.core.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.innerview.spring.entity.UserProfile;
import com.innerview.spring.enums.EmploymentStatus;
import com.innerview.spring.exception.ApiException;
import org.junit.jupiter.api.Test;

class ProfileFieldRulesTest {

  @Test
  void normalizesText() {
    assertThat(ProfileFieldRules.optional("  Cairo   University ")).isEqualTo("Cairo University");
    assertThat(ProfileFieldRules.optional("   ")).isNull();
    assertThat(ProfileFieldRules.optional(null)).isNull();
    assertCode(() -> ProfileFieldRules.required(" ", "College"), "FIELD_REQUIRED");
  }

  @Test
  void requiresCompanyOnlyWhenEmployed() {
    UserProfile profile = new UserProfile();
    assertCode(() -> ProfileFieldRules.applyEmployment(profile, EmploymentStatus.EMPLOYED, " "), "FIELD_REQUIRED");
    assertCode(() -> ProfileFieldRules.applyEmployment(profile, null, "Acme"), "FIELD_REQUIRED");

    ProfileFieldRules.applyEmployment(profile, EmploymentStatus.EMPLOYED, "Acme");
    assertThat(profile.getCompany()).isEqualTo("Acme");

    ProfileFieldRules.applyEmployment(profile, EmploymentStatus.STUDENT, "Acme");
    assertThat(profile.getEmploymentStatus()).isEqualTo(EmploymentStatus.STUDENT);
    assertThat(profile.getCompany()).isNull();
  }

  @Test
  void acceptsHttpsLinksOnTheRightSite() {
    assertThat(ProfileFieldRules.httpsUrl("linkedin.com/in/jane", "LinkedIn URL", "linkedin.com"))
        .isEqualTo("https://linkedin.com/in/jane");
    assertThat(ProfileFieldRules.httpsUrl("https://www.linkedin.com/in/jane", "LinkedIn URL", "linkedin.com"))
        .isEqualTo("https://www.linkedin.com/in/jane");
    assertThat(ProfileFieldRules.httpsUrl("https://jane.dev", "Portfolio URL", null)).isEqualTo("https://jane.dev");
    assertThat(ProfileFieldRules.httpsUrl("", "Portfolio URL", null)).isNull();
  }

  @Test
  void rejectsUnsafeOrWrongSiteLinks() {
    assertCode(() -> ProfileFieldRules.httpsUrl("http://jane.dev", "Portfolio URL", null), "INVALID_URL");
    assertCode(() -> ProfileFieldRules.httpsUrl("javascript:alert(1)", "Portfolio URL", null), "INVALID_URL");
    assertCode(() -> ProfileFieldRules.httpsUrl("https://localhost", "Portfolio URL", null), "INVALID_URL");
    assertCode(() -> ProfileFieldRules.httpsUrl("https://user:pw@jane.dev", "Portfolio URL", null), "INVALID_URL");
    assertCode(() -> ProfileFieldRules.httpsUrl("https://github.com.evil.io/x", "GitHub URL", "github.com"), "INVALID_URL");
    assertCode(() -> ProfileFieldRules.httpsUrl("https://notgithub.com/x", "GitHub URL", "github.com"), "INVALID_URL");
  }

  @Test
  void validatesTimeZones() {
    assertThat(ProfileFieldRules.timezone("Africa/Cairo")).isEqualTo("Africa/Cairo");
    assertThat(ProfileFieldRules.timezone(" ")).isNull();
    assertCode(() -> ProfileFieldRules.timezone("Mars/Olympus"), "INVALID_TIMEZONE");
  }

  private static void assertCode(org.assertj.core.api.ThrowableAssert.ThrowingCallable call, String code) {
    assertThatThrownBy(call).isInstanceOf(ApiException.class).extracting("code").isEqualTo(code);
  }
}
