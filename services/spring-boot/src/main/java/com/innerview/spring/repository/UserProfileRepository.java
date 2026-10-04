package com.innerview.spring.repository;

import com.innerview.spring.entity.User;
import com.innerview.spring.entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;


@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile,Long> {





    Optional<UserProfile> getUserProfileByUser(User user);

    Optional<UserProfile> getUserProfileByUser_Id(UUID userId);

    java.util.List<UserProfile> findByUser_IdIn(java.util.Collection<UUID> userIds);
}
