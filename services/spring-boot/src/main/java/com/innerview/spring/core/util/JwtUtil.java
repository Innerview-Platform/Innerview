package com.innerview.spring.core.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Duration;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

@Component
public class JwtUtil {
	@Value("${jwt.secret}")
	private String secret;

	/** e.g. "15m"; a plain number is read as milliseconds (Spring's Duration conversion). */
	@Value("${jwt.access-token.expiration}")
	private Duration accessTokenExpiration;

	@Value("${jwt.refresh-token.expiration}")
	private Duration refreshTokenExpiration;

	private Key getSigningKey() {
		byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
		return Keys.hmacShaKeyFor(keyBytes);
	}

	/** Token type claim: access tokens authenticate API calls, refresh tokens only mint new ones. */
	public static final String TYPE_CLAIM = "typ";
	public static final String TYPE_ACCESS = "access";
	public static final String TYPE_REFRESH = "refresh";

	public String generateAccessToken(UUID userId) {
		Map<String, Object> claims = new HashMap<>();
		claims.put(TYPE_CLAIM, TYPE_ACCESS);
		return createToken(claims, userId.toString(), accessTokenExpiration);
	}

	public String generateRefreshToken(UUID userId) {
		Map<String, Object> claims = new HashMap<>();
		claims.put(TYPE_CLAIM, TYPE_REFRESH);
		claims.put("jti", UUID.randomUUID().toString()); // unique even when minted twice in the same second
		return createToken(claims, userId.toString(), refreshTokenExpiration);
	}

	private String createToken(Map<String, Object> claims, String subject, Duration expiration) {
		Date now = new Date();
		Date expiryDate = new Date(now.getTime() + expiration.toMillis());

		return Jwts.builder()
				.setClaims(claims)
				.setSubject(subject)
				.setIssuedAt(now)
				.setExpiration(expiryDate)
				.signWith(getSigningKey(), SignatureAlgorithm.HS256)
				.compact();
	}

	public UUID extractUserId(String token) {
		String userId = extractClaim(token, Claims::getSubject);
		return UUID.fromString(userId);
	}

	public Date extractExpiration(String token) {
		return extractClaim(token, Claims::getExpiration);
	}

	public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
		final Claims claims = extractAllClaims(token);
		return claimsResolver.apply(claims);
	}

	private Claims extractAllClaims(String token) {
		try {
			return Jwts.parserBuilder()
					.setSigningKey(getSigningKey())
					.build()
					.parseClaimsJws(token)
					.getBody();
		} catch (JwtException e) {
			throw new JwtException("Invalid or expired JWT token", e);
		}
	}

	public boolean isTokenExpired(String token) {
		try {
			return extractExpiration(token).before(new Date());
		} catch (JwtException e) {
			return true;
		}
	}

	/** Valid, unexpired and an access token (refresh tokens must not authenticate API calls). */
	public boolean validateAccessToken(String token) {
		try {
			return !isTokenExpired(token) && TYPE_ACCESS.equals(extractClaim(token, c -> c.get(TYPE_CLAIM, String.class)));
		} catch (JwtException e) {
			return false;
		}
	}

	public boolean validateToken(String token) {
		try {
			extractAllClaims(token);
			return !isTokenExpired(token);
		} catch (JwtException e) {
			return false;
		}
	}
}
