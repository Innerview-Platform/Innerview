# collaboration-canvas

Self-hosted Excalidraw scene sync server behind the interview room's **Whiteboard** tab.

| Endpoint | Purpose |
|---|---|
| `WS /connect/:roomId?token=…` | Live scene sync for one interview room (token is a room ticket) |
| `GET /health` | Health check |
| `POST /internal/rooms/:room/:action` | Backend room close and user revoke hooks |

- **Auth** — sockets need a valid InnerView room ticket, verified with the backend's `JWT_SECRET` (HS256).
- **Storage** — one SQLite file per room in `$CANVAS_DATA_DIR/rooms` (default `./data`). Drawings survive restarts and everyone leaving.
- **Read-only** — review tickets and ended interviews can receive scenes but cannot submit changes.
- **Retention** — ended boards are deleted after `CANVAS_RETENTION_DAYS` (default 180).

## Run

```bash
npm ci
npm run dev        # reads ../../../.env, restarts on changes, listens on CANVAS_PORT (5858)
```

The frontend reaches it at `/canvas/*` on its own origin (Vite proxy in development, nginx in Docker).

| Variable | Default | |
|---|---|---|
| `JWT_SECRET` | — (required) | Same secret as the Spring backend |
| `CANVAS_PORT` | `5858` | |
| `CANVAS_DATA_DIR` | `./data` | Room scenes |
| `FRONTEND_URL` | `http://localhost:3000` | Allowed CORS origin(s), comma separated |
