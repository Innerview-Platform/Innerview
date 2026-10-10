# Deploying InnerView on a VPS (Hostinger, domain innerviewhub.com)

This guide deploys the whole stack on a single VPS with Docker Compose and serves it at
**`https://innerviewhub.com`**. The API root is `https://innerviewhub.com/api`. The domain's DNS
(Spaceship) has an `A` record for `innerviewhub.com` → `187.124.30.226` and a `CNAME` for `www` →
`innerviewhub.com`. `https://www.innerviewhub.com` and `https://187.124.30.226` redirect to the domain.

```
Browser ──HTTPS 443──▶ Caddy ──▶ frontend (nginx) ──┬─ /            React app
                         │                          ├─ /api, /ws-signal, /oauth2 ─▶ backend (Spring Boot) ─▶ MySQL, Redis, DynamoDB, Piston
                         │                          ├─ /canvas ─▶ canvas (Excalidraw sync)
                         │                          └─ /collab ─▶ editor (Hocuspocus)
        ──WSS 7443────▶ Caddy ──▶ LiveKit (video signaling)
        ──7881/tcp, 7882/udp──▶ LiveKit (video/audio media)
```

**Why HTTPS is required.** Browsers only allow the camera, the microphone and `crypto.randomUUID()`
on secure (HTTPS) pages. Over plain HTTP the interview room would not work. Caddy gets free
Let's Encrypt certificates for the domain and `www` (and a 6-day certificate for the bare IP, used only
to redirect old links), and renews them all automatically.

The files involved:

| File | Purpose |
|------|---------|
| `docker-compose.yml` | All services (also used for local development) |
| `docker-compose.prod.yml` | Production overrides: Caddy/HTTPS, real LiveKit keys, required secrets, Spring `prod` profile |
| `infrastructure/caddy/Caddyfile` | HTTPS reverse proxy |
| `.env.production.example` | Template for the server's `.env` |
| `services/spring-boot/src/main/resources/application-prod.yml` | Spring production settings |

---

## 1. Prepare the VPS

**Size.** Use at least 4 GB RAM (8 GB, e.g. KVM 2, is comfortable) and 40 GB of disk. The Piston
language runtimes alone take about 8 GB.

**OS.** In hPanel → **VPS → OS & Panel → Operating System**, the simplest choice is **Ubuntu 24.04
with Docker** (under *Applications*). That template also gives you the **Docker Manager**. Plain
Ubuntu 24.04 works too; step 3 installs Docker.

Connect over SSH. Use the root password from hPanel → VPS → Overview, or hPanel's **Browser
terminal**:

```bash
ssh root@187.124.30.226
```

## 2. Open the firewall ports

The app needs these ports:

| Port | Protocol | Used for |
|------|----------|----------|
| 22 | TCP | SSH |
| 80 | TCP | Let's Encrypt validation + redirect to HTTPS |
| 443 | TCP + UDP | The app (HTTPS / HTTP3) |
| 7443 | TCP | LiveKit signaling (WSS) |
| 7881 | TCP | LiveKit media fallback |
| 7882 | UDP | LiveKit media (video/audio) |

- **hPanel firewall.** hPanel → VPS → **Security → Firewall**. If a firewall is enabled, add
  *accept* rules for the ports above. If no firewall exists, nothing is blocked there.
- **ufw on the server** (optional but recommended):

  ```bash
  ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw allow 443/udp
  ufw allow 7443/tcp && ufw allow 7881/tcp && ufw allow 7882/udp
  ufw --force enable
  ```

MySQL, Redis, Piston, DynamoDB and the internal services are bound to `127.0.0.1` in the compose
file. They are never reachable from the internet, even though Docker bypasses ufw.

## 3. Install the dependencies

Only **Docker** (with the Compose plugin), **git** and **curl** are needed on the server. Java,
Node, Maven, pnpm, MySQL and Redis all run inside containers and are installed by the Docker builds.

```bash
apt update && apt install -y git curl
docker --version || curl -fsSL https://get.docker.com | sh    # skip if you chose the Docker OS template
docker compose version                                         # must print v2.x
```

On a 4 GB VPS, add swap so the backend build doesn't run out of memory:

```bash
fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

## 4. Clone the repository

```bash
mkdir -p /opt && cd /opt
git clone https://github.com/Innerview-Platform/Innerview.git innerview
cd innerview
git checkout deployment        # the branch with these deployment files (or main once merged)
```

The repository is private, so git asks for credentials. Use your GitHub username and a
**Personal Access Token** (GitHub → Settings → Developer settings → Tokens, with read access to the
repo) as the password. Your GitHub password won't work.

## 5. Create the `.env` file

```bash
cp .env.production.example .env
# Fill every CHANGE_ME with a random secret:
for k in DB_PASSWORD DB_ROOT_PASSWORD JWT_SECRET LIVEKIT_API_SECRET; do
  sed -i "s|^$k=CHANGE_ME|$k=$(openssl rand -hex 32)|" .env
done
nano .env      # check PUBLIC_HOST / PUBLIC_IP, and add the optional keys below
```

| Variable | Value |
|----------|-------|
| `PUBLIC_HOST` | `innerviewhub.com`. The address people open in the browser. Its DNS must point to `PUBLIC_IP`. |
| `PUBLIC_IP` | `187.124.30.226`. Advertised to browsers for the video connection. |
| `DB_*`, `JWT_SECRET`, `LIVEKIT_API_SECRET` | Generated by the loop above. Keep `.env` private and never commit it. |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | Optional. A Gmail address + [app password](https://myaccount.google.com/apppasswords) for invitation and password-reset emails. |
| `GOOGLE_*` | Optional. For Google sign-in, add `https://innerviewhub.com/login/oauth2/code/google` as an authorized redirect URI in Google Cloud Console. |

`COMPOSE_FILE=docker-compose.yml:docker-compose.prod.yml` is already set in this file. Every
`docker compose` command you run in `/opt/innerview` then uses the production setup automatically.

The shared whiteboard uses Excalidraw and does not require a license key.

## 6. Build and start everything

```bash
docker compose up -d --build
```

The first build takes about 10–20 minutes (Maven and pnpm downloads). Follow the progress with:

```bash
docker compose ps                 # every service should become "running" / "healthy"
docker compose logs -f backend    # wait for "Started ...Application"
docker compose logs caddy | grep -i -E "certificate obtained|error"
```

**The MySQL database** is created automatically. On its first start the `mysql` container creates the
`innerview` database and the `DB_USERNAME` user from `.env`. Spring (`ddl-auto: update`) then creates
all the tables. To check:

```bash
docker exec -it innerview-mysql sh -c 'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" innerview -e "SHOW TABLES;"'
```

## 7. Install the code-runner languages (once)

The code editor's **Run** button uses Piston, which starts with no languages installed:

```bash
./scripts/piston-install-languages.sh
```

This takes about 5–15 minutes and uses about 8 GB of disk. It is safe to re-run. It installs Python,
JavaScript, TypeScript, C/C++, Java, Go, Rust and C#, which persist in the `piston-packages` volume.

## 8. Check that it works

```bash
curl -I https://innerviewhub.com                      # HTTP/2 200
curl https://innerviewhub.com/actuator/health         # {"status":"UP"}
curl -I https://www.innerviewhub.com                  # 301 → https://innerviewhub.com/
```

Open **https://innerviewhub.com** in your browser. It should load with a padlock and no certificate
warning.

## 9. Run an interview with your friend

1. You and your friend each open `https://innerviewhub.com` and **sign up** with email and password.
2. You (the interviewer) create an interview and share its room link. You can also invite your
   friend's email if mail is configured.
3. Both of you open the room. Allow **camera and microphone** when the browser asks, then join.
4. Test the video, the shared code editor (write code → **Run**), the whiteboard and the notes.

## 10. Hostinger Docker Manager

With the Docker OS template, hPanel → VPS → **Docker Manager** shows this project's containers
(`innerview-*`). Use it to see status, read logs and restart containers. Build and update from SSH
as described below, because the project builds from source and combines two compose files, which
the Manager's YAML editor doesn't handle.

## Updating to a new version

```bash
cd /opt/innerview
git pull
docker compose up -d --build
docker image prune -f
```

Data survives updates. It lives in Docker volumes: `mysql-data`, `redis-data`,
`piston-packages` and `caddy-data`. **Never** run `docker compose down -v` on the server, because
that deletes the volumes.

New database columns and tables (for example usernames, profile files and `user_stats`) are added
automatically when the backend starts. On startup the backend also recomputes every user's rating and
interview counts in `user_stats`, and it repeats this every night at 03:30.

## Backups

```bash
docker exec innerview-mysql sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --hex-blob innerview' | gzip > innerview-$(date +%F).sql.gz
```

Profile photos and resumes are stored in MySQL (the `stored_files` table), so this backup includes
them. `--hex-blob` keeps those binary files intact in the dump. Uploads are limited to 5 MB each.
Photos are shrunk to about 10–60 KB, so expect roughly 0.1–1 MB of database growth per user who uploads a resume.

To browse the database from your laptop, use an SSH tunnel with DBeaver/DataGrip on
`localhost:3306`:

```bash
ssh -L 3306:127.0.0.1:3306 root@187.124.30.226
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Browser shows a certificate error / Caddy logs `could not get certificate` | Ports 80 and 443 must be open (step 2), and no other web server may use them: `ss -tlnp \| grep -E ':80\|:443'`. Check `docker compose logs caddy`. |
| Caddy logs `could not get certificate` for the domain | Check DNS: `dig @1.1.1.1 innerviewhub.com A` and `dig @1.1.1.1 www.innerviewhub.com A` must return `187.124.30.226`, with no stray `AAAA` record. |
| Domain doesn't resolve on one computer, but `dig @1.1.1.1` works | A local or router DNS cache still holds an old "not found" answer (kept up to 1 hour). Restart the router or use 1.1.1.1 as DNS. |
| Google sign-in shows `redirect_uri_mismatch` | Add `https://innerviewhub.com/login/oauth2/code/google` to the OAuth client's authorized redirect URIs in Google Cloud Console. |
| `502 Bad Gateway` right after starting | The backend needs about 1–2 minutes to start. Check `docker compose logs backend`. |
| Video stays black / "connecting" | Port **7882/udp** (and 7881/tcp, 7443/tcp) must be open in the hPanel firewall and ufw. Check `docker compose logs livekit`. |
| Run button: no languages | Run step 7. |
| Google sign-in | Google doesn't accept an IP address as a redirect URI. Use a domain (or the sslip.io name above), add `https://<host>/login/oauth2/code/google` to the OAuth client, and set the `GOOGLE_*` values. |
| Something else | `docker compose ps`, `docker compose logs -f <service>`, `docker compose restart <service>`. |
