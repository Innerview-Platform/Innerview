package com.innerview.spring.service;

import com.innerview.spring.dto.RunCodeSignalPayload;
import com.innerview.spring.dto.RuntimeDto;

import java.util.List;
import java.util.UUID;

/**
 * Runs the shared editor's code interactively and streams the output to everyone in the room.
 * A room has at most one active run; starting another one stops the previous run.
 */
public interface CodeRunnerService {

    List<RuntimeDto> listRuntimes();

    void run(String roomId, UUID userId, RunCodeSignalPayload payload);

    void sendInput(String roomId, UUID userId, String data);

    void stop(String roomId, UUID userId);

    /** Stops any run in the room (the interview ended). */
    void stopRoom(String roomId);

    /** Shares the selected language with the room so both editors run and highlight the same one. */
    void changeLanguage(String roomId, UUID userId, String language);

    /** Broadcasts the room's current language and run status (used by clients after (re)connecting). */
    void broadcastState(String roomId);
}
