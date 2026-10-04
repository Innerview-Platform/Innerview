package com.innerview.spring.dto.file;

/** A stored file's decoded bytes plus what is needed to serve them over HTTP. */
public record FileContent(StoredFileInfo info, byte[] bytes) {}
