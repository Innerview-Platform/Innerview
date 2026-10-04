package com.innerview.spring.core.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.Key;
import java.security.MessageDigest;
import java.util.Date;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Room tickets: short-lived proofs of room membership, required by every room-scoped service (STOMP
 * CONNECT, LiveKit tokens, the code runner, the Hocuspocus editor server and the Excalidraw server).
 *
 * <p>Tickets are signed with a key <em>derived</em> from {@code JWT_SECRET} (HMAC-SHA256 of a fixed
 * label), so a ticket is never accepted as an access token and vice versa. The Node services derive
 * the same key: {@code createHmac('sha256', JWT_SECRET).update('innerview-room-ticket').digest()}.
 */
@Component
public class RoomTicketService {

  public static final String TICKET_LABEL = "innerview-room-ticket";
  public static final String INTERNAL_LABEL = "innerview-internal";
  public static final long TICKET_TTL_MS = 5 * 60_000;
  /** Review tickets (summary page after the interview) are read-only and last longer. */
  public static final long REVIEW_TTL_MS = 60 * 60_000;

  private final Key ticketKey;
  private final String internalToken;

  public RoomTicketService(@Value("${jwt.secret}") String jwtSecret) {
    this.ticketKey = Keys.hmacShaKeyFor(hmac(jwtSecret, TICKET_LABEL));
    this.internalToken = HexFormat.of().formatHex(hmac(jwtSecret, INTERNAL_LABEL));
  }

  public record Ticket(
      UUID userId, String room, String role, String name, boolean staff, boolean host, boolean readonly) {}

  /**
   * @param staff host or interviewer: may admit people and open the private interviewer notes
   * @param readonly observers and review tickets can't edit shared documents or the whiteboard
   */
  public String issue(
      UUID userId, String room, String role, String name, boolean staff, boolean host, boolean readonly, long ttlMs) {
    Date now = new Date();
    return Jwts.builder()
        .setSubject(userId.toString())
        .addClaims(
            Map.of(
                "typ", "room",
                "room", room,
                "role", role,
                "name", name == null ? "" : name,
                "staff", staff,
                "host", host,
                "readonly", readonly))
        .setIssuedAt(now)
        .setExpiration(new Date(now.getTime() + ttlMs))
        .signWith(ticketKey, SignatureAlgorithm.HS256)
        .compact();
  }

  /** Parses and verifies a ticket; null when invalid, expired or not a room ticket. */
  public Ticket verify(String token) {
    if (token == null || token.isBlank()) return null;
    try {
      Claims claims = Jwts.parserBuilder().setSigningKey(ticketKey).build().parseClaimsJws(token).getBody();
      if (!"room".equals(claims.get("typ", String.class))) return null;
      return new Ticket(
          UUID.fromString(claims.getSubject()),
          claims.get("room", String.class),
          claims.get("role", String.class),
          claims.get("name", String.class),
          Boolean.TRUE.equals(claims.get("staff", Boolean.class)),
          Boolean.TRUE.equals(claims.get("host", Boolean.class)),
          Boolean.TRUE.equals(claims.get("readonly", Boolean.class)));
    } catch (JwtException | IllegalArgumentException e) {
      return null;
    }
  }

  /** Shared secret for service-to-service calls (Hocuspocus → backend and backend → Node services). */
  public String internalToken() {
    return internalToken;
  }

  public boolean isInternalToken(String presented) {
    return presented != null
        && MessageDigest.isEqual(presented.getBytes(StandardCharsets.UTF_8), internalToken.getBytes(StandardCharsets.UTF_8));
  }

  private static byte[] hmac(String secret, String label) {
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
      return mac.doFinal(label.getBytes(StandardCharsets.UTF_8));
    } catch (GeneralSecurityException e) {
      throw new IllegalStateException("HMAC-SHA256 unavailable", e);
    }
  }
}
