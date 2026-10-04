package com.innerview.spring.dto;

import lombok.Data;

@Data
public class InterviewResponse {
  Long interviewId;
  /** Canonical room code, e.g. "abcdefghij". */
  String roomId;
  /** Display form, e.g. "abc-defg-hij". */
  String displayCode;
  /** Shareable link, e.g. https://innerview.app/abc-defg-hij */
  String roomLink;
}
