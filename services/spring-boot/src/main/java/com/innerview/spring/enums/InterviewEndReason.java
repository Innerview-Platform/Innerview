package com.innerview.spring.enums;

/** Why an interview ended; sent to the room with the close event. */
public enum InterviewEndReason {
  ENDED_BY_HOST("The host ended the interview."),
  TIME_UP("The interview's time is up."),
  EMPTY("Everyone left, so the interview was closed."),
  NO_SHOW("Nobody joined the interview.");

  private final String message;

  InterviewEndReason(String message) {
    this.message = message;
  }

  public String message() {
    return message;
  }
}
