package com.innerview.spring.interfaces;

/** EmailSendable */
public interface EmailSendable {

  /** The email subject line for this notification. */
  String getEmailSubject();

  /** Fully-rendered HTML body for this notification's email. */
  String toEmailContent();
}
