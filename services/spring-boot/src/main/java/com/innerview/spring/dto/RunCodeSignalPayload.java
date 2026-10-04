package com.innerview.spring.dto;

import lombok.Data;

/** Payload of the RUN_CODE signal: the shared editor's current state plus the Piston language to run it as. */
@Data
public class RunCodeSignalPayload {
    private String language;
    private String plainText;    // The code that gets executed
    /** Stop a program someone else is running and run this instead. */
    private boolean force;
}
