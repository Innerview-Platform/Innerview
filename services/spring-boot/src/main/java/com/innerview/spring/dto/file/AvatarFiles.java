package com.innerview.spring.dto.file;

/** The two sizes stored for a profile photo. */
public record AvatarFiles(StoredFileInfo full, StoredFileInfo thumbnail) {}
