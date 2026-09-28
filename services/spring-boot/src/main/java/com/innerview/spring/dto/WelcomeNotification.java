package com.innerview.spring.dto;

import com.innerview.spring.interfaces.EmailSendable;
import com.innerview.spring.interfaces.InAppSendable;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class WelcomeNotification extends Notification implements EmailSendable, InAppSendable {

  private final String platformName;
  private final String loginUrl;

  public WelcomeNotification(
      String recipientId, String recipientEmail, String platformName, String loginUrl) {
    super(recipientId, recipientEmail);
    this.platformName = platformName;
    this.loginUrl = loginUrl;
  }

  @Override
  public String getEmailSubject() {
    return "Welcome to " + platformName + "!";
  }

  @Override
  public String toEmailContent() {
    return NotificationEmailTemplate.render(
        "Account created",
        "Welcome to " + platformName + ".",
        "Hey there — your account is ready. Jump into a mock interview whenever you're set, "
            + "or fill out your profile first so peers know what to expect.",
        List.of(),
        "Log in",
        loginUrl,
        "$ innerview --status ready<br>&gt; account created · profile pending");
  }

  @Override
  public String toInAppContent() {
    Map<String, Object> content = new LinkedHashMap<>();
    content.put("type", "WELCOME");
    content.put("notificationId", getNotificationId());
    content.put("title", "Welcome to " + platformName + "!");
    content.put(
        "message", "Your account is ready. Jump into your first mock interview whenever you're set.");
    content.put("loginUrl", loginUrl);
    content.put("createdAt", getCreatedAt().toString());
    return toJson(content);
  }
}
