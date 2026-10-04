# End-to-end tests

Scripted multi-user tests that drive the running stack (`make dev`) through the same APIs the
browser uses: REST, STOMP (`/ws-signal`), Hocuspocus (`:1234`) and Piston.

| Script | Covers |
|---|---|
| `rooms.e2e.mjs` | Session refresh (httpOnly cookie, rotation, typed tokens), invites, room codes in any case, lobby (knock → admit/deny), room tickets for STOMP/video/editor, presence (second tab + "Join here", 60 s reconnect grace), roles and swap, observers read-only, run lock, chat, 300 KB documents, private notes access, removal, host hand-off, extend, end + saved summary, feedback scorecards, replay |
| `code-runner.e2e.mjs` | Every installed Piston language with interactive stdin answered by the other participant, compile errors, stopping a blocking program |

## Setup (once)

The tests use three accounts: `alice.runner@innerview.test` (host), `bob.runner@innerview.test`
and `carol.runner@innerview.test`, all with the same password. Sign-up verifies that the mailbox
exists, so create them directly in the local database:

```bash
PW='choose-a-password-1A!'
HASH=$(htpasswd -bnBC 10 "" "$PW" | tr -d ':\n' | sed 's/^\$2y/$2a/')
for u in alice bob carol; do
  mysql -u "$DB_USERNAME" -p"$DB_PASSWORD" -h 127.0.0.1 innerview -e "
    INSERT IGNORE INTO users (id, auth_provider, created_at, email, forgot_password_count, name, password_hash, updated_at)
    VALUES (UUID_TO_BIN(UUID()), 'local', NOW(6), '$u.runner@innerview.test', 0, CONCAT(UPPER(LEFT('$u',1)), SUBSTRING('$u',2), ' Tester'), '$HASH', NOW(6));"
done
```

## Run

```bash
make dev   # in another terminal
TEST_PASSWORD="$PW" node tests/e2e/rooms.e2e.mjs
TEST_PASSWORD="$PW" node tests/e2e/code-runner.e2e.mjs
```

`API` (default `http://localhost:8080`) and `EDITOR_WS` (default `ws://localhost:1234`) point the
scripts at another environment. Each run creates and ends its own interviews.
