# collaboration-canvas

Self-hosted [tldraw](https://tldraw.dev) sync server behind the interview room's **Whiteboard** tab.
Based on tldraw's [simple-server-example](https://github.com/tldraw/tldraw/tree/main/templates/simple-server-example).

| Endpoint | Purpose |
|---|---|
| `WS /connect/:roomId?sessionId=…&token=…` | Multiplayer sync for one interview room (`TLSocketRoom`) |
| `PUT /uploads/:id` | Upload an image/video (needs `Authorization: Bearer <access token>`) |
| `GET /uploads/:id` | Serve an uploaded asset |
| `GET /health` | Health check |

- **Auth** — sockets and uploads need a valid InnerView access token, verified with the backend's
  `JWT_SECRET` (HS256). Rejected sockets close with tldraw's `NOT_AUTHENTICATED` reason.
- **Storage** — one SQLite file per room in `$CANVAS_DATA_DIR/rooms`, uploads in `$CANVAS_DATA_DIR/assets`
  (default `./data`). Drawings survive restarts and everyone leaving.
- **Link previews** are not fetched (no `/unfurl`), so the server never requests arbitrary URLs.

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
| `CANVAS_DATA_DIR` | `./data` | Rooms and uploads |
| `FRONTEND_URL` | `http://localhost:3000` | Allowed CORS origin(s), comma separated |
| `CANVAS_MAX_UPLOAD_MB` | `10` | |

## License

tldraw runs without a key in development (localhost / non-HTTPS). Production HTTPS deployments need a
[tldraw license key](https://tldraw.dev/pricing) set as `VITE_TLDRAW_LICENSE_KEY` when building the frontend.
