package com.innerview.spring.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.innerview.spring.core.file.TestFiles;
import com.innerview.spring.entity.User;
import com.innerview.spring.repository.StoredFileRepository;
import com.innerview.spring.repository.UserProfileRepository;
import com.innerview.spring.repository.UserRepository;
import com.innerview.spring.service.RefreshTokenService;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

/** End to end through the real security chain, multipart handling and database. */
@SpringBootTest
@AutoConfigureMockMvc
class ProfileFilesIntegrationTest {
  @Autowired MockMvc mockMvc;
  @Autowired UserRepository users;
  @Autowired UserProfileRepository profiles;
  @Autowired StoredFileRepository storedFiles;
  @Autowired RefreshTokenService tokens;
  @Autowired ObjectMapper json;
  @Autowired org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

  private User user;
  private String bearer;

  @BeforeEach
  void setUp() {
    user = new User();
    user.setName("File Tester");
    user.setUsername("file.tester." + UUID.randomUUID().toString().substring(0, 8));
    user.setEmail("files-" + UUID.randomUUID() + "@example.com");
    user.setPasswordHash("hash");
    user.setForgotPasswordCount(0);
    user = users.save(user);
    bearer = "Bearer " + tokens.createAccessToken(user);
  }

  @AfterEach
  void tearDown() {
    // stored_files references users; other tests delete all users.
    storedFiles.deleteAll();
    profiles.getUserProfileByUser_Id(user.getId()).ifPresent(profiles::delete);
    users.deleteById(user.getId());
  }

  @Test
  void avatarsUploadWithATokenAndLoadWithoutOne() throws Exception {
    MockMultipartFile photo = new MockMultipartFile("file", "me.png", "image/png", TestFiles.png(800, 600));
    String body = mockMvc.perform(multipart(HttpMethod.PUT, "/api/profile/me/avatar").file(photo).header("Authorization", bearer))
        .andExpect(status().isOk())
        .andReturn().getResponse().getContentAsString();
    String avatarUrl = json.readTree(body).get("avatar_url").asText();

    byte[] image = mockMvc.perform(get(avatarUrl))
        .andExpect(status().isOk())
        .andExpect(header().string("Content-Type", "image/jpeg"))
        .andExpect(header().string("Cache-Control", "max-age=31536000, public, immutable"))
        .andReturn().getResponse().getContentAsByteArray();
    assertThat(javax.imageio.ImageIO.read(new java.io.ByteArrayInputStream(image)).getWidth()).isEqualTo(512);

    mockMvc.perform(multipart(HttpMethod.PUT, "/api/profile/me/avatar").file(photo)).andExpect(status().isUnauthorized());
  }

  @Test
  void resumesNeedATokenAndComeBackUnchanged() throws Exception {
    byte[] pdf = TestFiles.pdf(1);
    mockMvc.perform(multipart(HttpMethod.PUT, "/api/profile/me/resume")
            .file(new MockMultipartFile("file", "CV.pdf", "application/pdf", pdf))
            .header("Authorization", bearer))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.filename").value("CV.pdf"));

    byte[] downloaded = mockMvc.perform(get("/api/profile/me/resume").header("Authorization", bearer))
        .andExpect(status().isOk())
        .andExpect(header().string("Cache-Control", "no-store, private"))
        .andReturn().getResponse().getContentAsByteArray();
    assertThat(downloaded).isEqualTo(pdf);

    mockMvc.perform(get("/api/profile/me/resume")).andExpect(status().isUnauthorized());

    // The resume never comes out of the public avatar route, even by id.
    JsonNode me = json.readTree(mockMvc.perform(get("/api/profile/me").header("Authorization", bearer))
        .andReturn().getResponse().getContentAsString());
    assertThat(me.get("resume").get("filename").asText()).isEqualTo("CV.pdf");
    UUID resumeId = storedFiles.findAll().stream()
        .filter(f -> f.getKind() == com.innerview.spring.enums.StoredFileKind.RESUME).findFirst().orElseThrow().getId();
    mockMvc.perform(get("/api/files/avatars/" + resumeId)).andExpect(status().isNotFound());
  }

  @Test
  void usernameChecksArePublicButProfilesAndReviewsAreNot() throws Exception {
    mockMvc.perform(get("/api/auth/username-available").param("username", user.getUsername()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.available").value(false));
    mockMvc.perform(get("/api/auth/username-available").param("username", user.getUsername()).header("Authorization", bearer))
        .andExpect(jsonPath("$.available").value(true));

    mockMvc.perform(get("/api/profile/" + user.getUsername())).andExpect(status().isUnauthorized());
    mockMvc.perform(get("/api/profile/me/reviews")).andExpect(status().isUnauthorized());
    mockMvc.perform(get("/api/profile/" + user.getUsername().toUpperCase()).header("Authorization", bearer))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("File Tester"));
  }

  @Test
  void deletingTheAccountStopsItsAccessTokenImmediately() throws Exception {
    user.setPasswordHash(passwordEncoder.encode("Secret1!"));
    users.save(user);

    mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/profile/me/delete-account")
            .header("Authorization", bearer)
            .contentType("application/json")
            .content("{\"confirmation\":\"" + user.getUsername() + "\",\"password\":\"wrong\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("WRONG_PASSWORD"));

    mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/profile/me/delete-account")
            .header("Authorization", bearer)
            .contentType("application/json")
            .content("{\"confirmation\":\"" + user.getUsername() + "\",\"password\":\"Secret1!\"}"))
        .andExpect(status().isNoContent())
        .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.containsString("Max-Age=0")));

    // The access token is still cryptographically valid for ~15 minutes, but it no longer works.
    mockMvc.perform(get("/api/profile/me").header("Authorization", bearer)).andExpect(status().isUnauthorized());
  }
}
