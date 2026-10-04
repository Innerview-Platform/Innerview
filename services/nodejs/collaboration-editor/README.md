# collaboration-editor

[Hocuspocus](https://tiptap.dev/docs/hocuspocus) (Yjs) server for the interview room's shared
documents. Each room has `{room}/code`, `{room}/notes` and `{room}/private` (interviewers only).

- **Auth** — clients send a *room ticket* (issued by the backend on join, signed with a key derived
  from `JWT_SECRET`). Observers, review tickets and ended interviews are read-only.
- **Persistence** — Redis via `$EDITOR_REDIS_URL` (default `redis://localhost:6379`); every store is mirrored to the
  backend (`POST /api/internal/documents`) so the interview row always has the latest text.
- **Replay** — every update of the code document is kept; `GET /replay/:room?token=…` returns them.
- **Internal API** (`X-Internal-Token`): `POST /internal/rooms/:room/{flush|revoke|close}`.

```bash
npm ci
npm run dev   # reads ../../../.env, listens on EDITOR_PORT (1234)
```

| Variable | Default | |
|---|---|---|
| `JWT_SECRET` | — (required) | Same as the backend |
| `EDITOR_PORT` | `1234` | |
| `EDITOR_REDIS_URL` | `redis://localhost:6379` | Falls back to `REDIS_HOST` / `REDIS_PORT` |
| `BACKEND_INTERNAL_URL` | `http://localhost:8080` | Where snapshots are sent |

The code state/text/version use the existing Spring keys `room:<id>:state`,
`room:<id>:text`, and `room:<id>:version`. Notes and private notes have separate
keys. Code replay uses an ordered Redis list; ended-room markers also survive
restarts. Docker enables Redis AOF and keeps all collaboration data in `redis-data`.
There is no automatic migration of existing SQLite files; keep a backup if you
have interviews created by the original editor server.

`npm test` runs storage integration tests against `EDITOR_REDIS_URL` (use a dedicated
Redis database; the tests delete only their own room keys).
