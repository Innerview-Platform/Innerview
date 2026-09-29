# 🐳 Docker — InnerView Platform

Run the entire InnerView platform locally with a single command.

> Deploying to a server (HTTPS on a public IP)? See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/Innerview.git
cd Innerview

# 2. Create your environment file
cp .env.example .env

# 3. Build and start all services
docker compose up --build
```

Once all services are healthy, open **http://localhost:3000** in your browser.

## Architecture

```
Browser (http://localhost:3000)
  │
  ├── Static files ──→ nginx (frontend container)
  ├── /api/*        ──→ nginx ──→ Spring Boot (backend container)
  ├── /ws-signal/*  ──→ nginx ──→ Spring Boot (WebSocket)
  ├── /oauth2/*     ──→ nginx ──→ Spring Boot (Google OAuth2)
  ├── /canvas/*     ──→ nginx ──→ tldraw sync server (shared whiteboard)
  ├── /collab/*     ──→ nginx ──→ Hocuspocus server (shared code editor + notes)
  │                                   │
  │                                   ├── MySQL (innerview-mysql:3306)
  │                                   └── Redis (innerview-redis:6379)
  │
  └── Video / Audio ──→ LiveKit SFU (innerview-livekit:7880)
```

## Services

| Service    | Container Name       | Internal Port | Host Port          | URL                            |
|------------|---------------------|--------------|--------------------|--------------------------------|
| Frontend   | `innerview-frontend` | 80           | 3000               | http://localhost:3000           |
| Backend    | `innerview-backend`  | 8080         | 8080               | http://localhost:8080           |
| LiveKit SFU| `innerview-livekit`  | 7880         | 7880               | `ws://localhost:7880`           |
| Canvas     | `innerview-canvas`   | 5858         | 5858               | http://localhost:5858/health    |
| Editor     | `innerview-editor`   | 1234         | 1234               | http://localhost:1234/health    |
| Piston     | `innerview-piston`   | 2000         | 2000               | http://localhost:2000/api/v2/runtimes |
| DynamoDB   | `innerview-dynamodb` | 8000         | 8000               | http://localhost:8000           |
| MySQL      | `innerview-mysql`    | 3306         | 3306               | `mysql://localhost:3306`        |
| Redis      | `innerview-redis`    | 6379         | 6379               | `redis://localhost:6379`        |

## Common Commands

```bash
# Start all services (build if needed)
docker compose up --build

# Start in the background
docker compose up -d --build

# View running containers
docker compose ps

# View logs (follow mode)
docker compose logs -f

# View logs for a specific service
docker compose logs -f backend
docker compose logs -f frontend

# Stop all services
docker compose down

# Stop and remove volumes (⚠️ deletes database data)
docker compose down -v

# Rebuild a specific service
docker compose build backend
docker compose build frontend

# Restart a specific service
docker compose restart backend
```

## Environment Variables

All configuration is managed through the `.env` file at the project root.

| Variable              | Default                          | Description                                    |
|-----------------------|----------------------------------|------------------------------------------------|
| `FRONTEND_PORT`       | `3000`                           | Host port for the frontend                     |
| `FRONTEND_URL`        | `http://localhost:3000`          | CORS origin + OAuth2 redirect base             |
| `DB_USERNAME`         | `innerview`                      | MySQL username                                 |
| `DB_PASSWORD`         | `innerview_pass`                 | MySQL password                                 |
| `DB_ROOT_PASSWORD`    | `root_pass`                      | MySQL root password                            |
| `DB_PORT`             | `3306`                           | Host port for MySQL                            |
| `REDIS_PORT`          | `6379`                           | Host port for Redis                            |
| `JWT_SECRET`          | *(dev placeholder)*              | JWT signing secret                             |
| `GOOGLE_CLIENT_ID`    | *(empty)*                        | Google OAuth2 client ID                        |
| `GOOGLE_CLIENT_SECRET`| *(empty)*                        | Google OAuth2 client secret                    |
| `MAIL_USERNAME`       | *(empty)*                        | Gmail address for outbound email               |
| `MAIL_PASSWORD`       | *(empty)*                        | Gmail app password                             |

## Database

### Connecting with a GUI client

```
Host:     localhost
Port:     3306
Database: innerview
Username: innerview
Password: innerview_pass
```

### Reset the database

```bash
# Stop everything and delete the MySQL volume
docker compose down -v

# Start fresh
docker compose up --build
```

The database schema is auto-created by Hibernate (`ddl-auto: update`).

## Code Execution (Piston)

The shared editor's **Run** button executes code in [Piston](https://github.com/engineer-man/piston)
(`innerview-piston`, privileged container). The backend opens a WebSocket to Piston's
`/api/v2/connect` for each run and relays output to everyone in the room over STOMP
(`/topic/room/{roomId}/run`). Input typed in the room's terminal is forwarded to the program's stdin.

### Installing the languages (do this once after `docker compose up`)

The Piston image ships with **no languages installed**. Until you install them, the editor's
language menu is empty and **Run** does nothing. Packages are downloaded into the `piston-packages`
volume, so you only need to do this **once per machine**. Repeat it only after
`docker compose down -v` or after deleting that volume.

1. Start the stack (or just Piston):

   ```bash
   docker compose up -d            # or: docker compose up -d piston
   ```

2. Install the languages. This takes about 5–15 minutes and roughly 8 GB of disk, depending on your connection:

   ```bash
   make piston-langs               # or: ./scripts/piston-install-languages.sh
   ```

   The script waits for Piston to become reachable and skips packages that are already installed,
   so it is safe to re-run. Point it at another host with
   `PISTON_URL=http://server:2000 ./scripts/piston-install-languages.sh`.

3. Check the result. It should list python, javascript, typescript, c, c++, java, go, rust and csharp:

   ```bash
   curl -s http://localhost:2000/api/v2/runtimes
   ```

4. Reload the interview room. The language menu picks up the runtimes automatically, with no backend restart needed.

| Package      | Version | Editor languages |
|--------------|---------|------------------|
| `python`     | 3.12.0  | Python           |
| `node`       | 20.11.1 | JavaScript       |
| `typescript` | 5.0.3   | TypeScript       |
| `gcc`        | 10.2.0  | C, C++           |
| `java`       | 15.0.2  | Java             |
| `go`         | 1.16.2  | Go               |
| `rust`       | 1.68.2  | Rust             |
| `mono`       | 6.12.0  | C#               |

To add or change a language, edit the `PACKAGES` list in `scripts/piston-install-languages.sh`.
Run `curl http://localhost:2000/api/v2/packages` to see every package Piston offers.

**Troubleshooting**

- *"Piston isn't reachable"*: check `docker compose ps piston` and `docker compose logs piston`.
  Piston needs `privileged: true`, which is already set in compose.
- *A package fails or times out*: re-run the script; it continues where it stopped.
  A half-downloaded package can be removed with
  `curl -X DELETE localhost:2000/api/v2/packages -H 'Content-Type: application/json' -d '{"language":"rust","version":"1.68.2"}'`.
- *Language menu still empty*: make sure the backend's `PISTON_URL` points at this Piston
  (`http://piston:2000` inside compose, `http://localhost:2000` for `make dev`).

Limits (see `docker-compose.yml`): each interactive run may last up to 5 minutes of wall time
(it usually waits on input) and 10 seconds of CPU time. Piston's WebSocket API cannot send EOF,
so programs that read stdin until end-of-file keep waiting — press **Stop** to end them.

## Shared Whiteboard (tldraw)

The room's **Whiteboard** tab is a [tldraw](https://tldraw.dev) canvas synced through a self-hosted
sync server (`innerview-canvas`, source in `services/nodejs/collaboration-canvas`). Drawings are stored
per room in the `canvas-data` volume. The server accepts only valid InnerView access tokens (it shares
`JWT_SECRET` with the backend).

tldraw needs a license key for production HTTPS deployments; set `VITE_TLDRAW_LICENSE_KEY` in `.env`
before building the frontend image. It isn't needed on localhost.

## Shared code editor and notes (Hocuspocus)

The code editor, the problem statement and the interviewers' private notes are Yjs documents on a
self-hosted [Hocuspocus](https://tiptap.dev/docs/hocuspocus) server (`innerview-editor`, source in
`services/nodejs/collaboration-editor`): incremental sync (no document size limit), live cursors,
SQLite persistence in the `editor-data` volume, snapshots mirrored to MySQL, and a replay timeline
for the interview summary.

## Room access

Every live service (STOMP, LiveKit video, code runner, whiteboard, editor) only accepts a short-lived
**room ticket** issued by the backend after someone joins. Tickets are signed with a key derived from
`JWT_SECRET`, so the backend, `innerview-canvas` and `innerview-editor` must share the same secret.

## Google OAuth2 Setup

To enable Google login:

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth2 credentials
3. Add `http://localhost:8080/login/oauth2/code/google` as an authorized redirect URI
4. Add your client ID and secret to `.env`:
   ```env
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```
5. Restart the backend: `docker compose restart backend`

## Troubleshooting

### Backend won't start — "Connection refused" to MySQL

MySQL may still be initializing. The backend has `depends_on` with a health check, but if the first attempt fails:

```bash
docker compose logs mysql    # Check MySQL is healthy
docker compose restart backend
```

### Frontend shows "502 Bad Gateway"

The backend hasn't started yet. Check its health:

```bash
docker compose logs backend
curl http://localhost:8080/actuator/health
```

### Port already in use

Change the host port in `.env`:

```env
FRONTEND_PORT=3001
DB_PORT=3307
REDIS_PORT=6380
```

### Rebuild from scratch

```bash
docker compose down -v --rmi local
docker compose up --build
```
