package com.innerview.spring.core.file;

/**
 * Upload limits. Keep spring.servlet.multipart.* (application.yml) and nginx's
 * client_max_body_size for /api/ (frontend/nginx.conf) slightly above these.
 */
public final class UploadLimits {
  public static final int MAX_IMAGE_BYTES = 5 * 1024 * 1024;
  public static final int MAX_RESUME_BYTES = 5 * 1024 * 1024;

  private UploadLimits() {}
}
