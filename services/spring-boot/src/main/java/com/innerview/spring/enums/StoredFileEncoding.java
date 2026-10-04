package com.innerview.spring.enums;

/** How a stored file's bytes are kept in the database. */
public enum StoredFileEncoding {
  /** The original bytes (already-compressed formats such as JPEG). */
  IDENTITY,
  /** java.util.zip Deflate, used only when it saves at least 10%. */
  DEFLATE
}
