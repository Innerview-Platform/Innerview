package com.innerview.spring.dto;

import com.innerview.spring.interfaces.InAppSendable;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/** In-app nudge to the host when someone waits in the lobby and no host/interviewer is in the room. */
public class JoinRequestNotification extends Notification implements InAppSendable {
  private final String requesterName;
  private final String roomUrl;

  public JoinRequestNotification(UUID hostId, String hostEmail, String requesterName, String roomUrl) {
    super(hostId.toString(), hostEmail);
    this.requesterName = requesterName;
    this.roomUrl = roomUrl;
  }

  @Override
  public String toInAppContent() {
    Map<String, Object> content = new LinkedHashMap<>();
    content.put("type", "JOIN_REQUEST");
    content.put("notificationId", getNotificationId());
    content.put("title", "Someone is waiting to join");
    content.put("message", requesterName + " is waiting in the lobby of your interview.");
    content.put("sessionUrl", roomUrl);
    content.put("createdAt", getCreatedAt().toString());
    return toJson(content);
  }
}
