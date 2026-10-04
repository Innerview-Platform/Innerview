package com.innerview.spring.enums;

/** Who can enter an interview room without being let in (Google Meet's "access type"). */
public enum AccessPolicy {
  /** Anyone with the link joins directly. */
  OPEN,
  /** Invited people join directly; everyone else asks and waits for the host or an interviewer. */
  ASK_TO_JOIN,
  /** Only invited people can join; others can't even ask. */
  INVITE_ONLY
}
