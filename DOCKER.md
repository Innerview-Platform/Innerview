# 🐳 Docker — InnerView Platform

Run the entire InnerView platform locally with a single command.

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
