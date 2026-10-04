package com.innerview.spring.service.impl;

import com.innerview.spring.entity.UserProfile;
import com.innerview.spring.repository.UserProfileRepository;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Small profile-photo URLs for lists of people (room participants, interview participants). */
@Component
@RequiredArgsConstructor
public class AvatarLookup {
  private final UserProfileRepository profiles;

  /** One query for all ids; users without a photo are missing from the map. */
  @Transactional(readOnly = true)
  public Map<UUID, String> thumbnails(Collection<UUID> userIds) {
    Map<UUID, String> result = new HashMap<>();
    if (userIds.isEmpty()) return result;
    for (UserProfile profile : profiles.findByUser_IdIn(userIds)) {
      String url = ProfileFileService.avatarOf(profile).avatarThumbUrl();
      if (url != null) result.put(profile.getUser().getId(), url);
    }
    return result;
  }

  public String thumbnail(UUID userId) {
    return thumbnails(java.util.List.of(userId)).get(userId);
  }
}
