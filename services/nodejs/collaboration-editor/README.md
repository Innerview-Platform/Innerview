# collaboration-editor

[Hocuspocus](https://tiptap.dev/docs/hocuspocus) (Yjs) server for the interview room's shared
documents. Each room has `{room}/code`, `{room}/notes` and `{room}/private` (interviewers only).

- **Auth** — clients send a *room ticket* (issued by the backend on join, signed with a key derived
  from `JWT_SECRET`). Observers, review tickets and ended interviews are read-only.
- **Persistence** — SQLite in `$EDITOR_DATA_DIR` (default `./data`); every store is mirrored to the
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
| `EDITOR_DATA_DIR` | `./data` | |
| `BACKEND_INTERNAL_URL` | `http://localhost:8080` | Where snapshots are sent |
