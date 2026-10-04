# collaboration-canvas

Self-hosted Excalidraw scene sync server behind the interview room's **Whiteboard** tab.

| Endpoint | Purpose |
|---|---|
| `WS /connect/:roomId?token=…` | Live scene sync for one interview room (token is a room ticket) |
| `GET /health` | Health check |
| `POST /internal/rooms/:room/:action` | Backend room close and user revoke hooks |

- **Auth** — sockets need a valid InnerView room ticket, verified with the backend's `JWT_SECRET` (HS256).
- **Storage** — Redis hashes at `room:{roomId}:canvas` store scenes (including image files) and read-only end markers. Drawings survive canvas restarts and everyone leaving; Redis must have persistence enabled (Docker Compose uses the `redis-data` volume and RDB snapshots). Redis snapshot frequency determines potential data loss after a Redis crash.
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
| `CANVAS_REDIS_URL` | `redis://localhost:6379` | Overrides `REDIS_HOST` / `REDIS_PORT`; supports Redis authentication and TLS URLs |
| `CANVAS_RETENTION_DAYS` | `180` | Ended-board retention |
| `FRONTEND_URL` | `http://localhost:3000` | Allowed CORS origin(s), comma separated |

Existing SQLite files are not automatically imported. Back up the old `canvas-data` volume before switching; those drawings require a separate migration to Redis. The code editor has its own SQLite storage and is unaffected.
