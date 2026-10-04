# Milestone 4 branch reconstruction

Original change: `4a9394a9ef00aff456a4fe1e20dfe1cee2a561e6` (`claude aboya`). Deployment source: `f2c839832e7bc6f27b5390cd4349c825aed9b685`.

Milestone revert: `847ce844adac05f617cba9e7fd3c9a3145d6601c`. `main` remains at `b516f179e00e4bc2729aeab03599fdcb054bae20`. The original deployment tip is retained unchanged.

The original milestone commit was reverted, then its changes and deployment’s final changes were reconstructed by responsibility. Each child branch was committed and merged into its feature with `--no-ff`; each feature was then merged into `milestone_4` with `--no-ff`. No feature was merged into `main`.

| Feature branch | Child branches | Scoped diff |
|---|---:|---|
| `feature/m4-authentication` | 3 | 14 files changed, 233 insertions(+), 93 deletions(-) |
| `feature/m4-room-management` | 4 | 82 files changed, 3898 insertions(+), 1091 deletions(-) |
| `feature/m4-code-execution` | 2 | 8 files changed, 857 insertions(+) |
| `feature/m4-interviews-and-feedback` | 3 | 37 files changed, 2221 insertions(+), 269 deletions(-) |
| `feature/m4-live-collaboration` | 6 | 277 files changed, 6479 insertions(+), 311 deletions(-) |
| `feature/m4-deployment` | 2 | 21 files changed, 1461 insertions(+), 20 deletions(-) |

## Child branches

| Feature | Child branch | Source commit |
|---|---|---|
| `feature/m4-authentication` | `subfeat/m4-session-refresh-ui` | `739819ec2cfd` |
| `feature/m4-authentication` | `subfeat/m4-cookie-refresh-backend` | `47b3a6b512e8` |
| `feature/m4-authentication` | `subfeat/m4-oauth-completion` | `88862ff68c0d` |
| `feature/m4-room-management` | `subfeat/m4-navigation-and-dashboard` | `9abf1ae6a14e` |
| `feature/m4-room-management` | `subfeat/m4-room-ui` | `de4f6c734374` |
| `feature/m4-room-management` | `subfeat/m4-access-presence-lifecycle` | `b9fda10495f1` |
| `feature/m4-room-management` | `subfeat/m4-room-domain` | `2842e6c0ddb7` |
| `feature/m4-code-execution` | `subfeat/m4-runner-ui` | `4ad1899ea0d1` |
| `feature/m4-code-execution` | `subfeat/m4-runner-backend` | `fdca7a8fe289` |
| `feature/m4-interviews-and-feedback` | `subfeat/m4-interview-review-ui` | `781bf02d78de` |
| `feature/m4-interviews-and-feedback` | `subfeat/m4-scheduling-and-invites` | `7bd419d6fa96` |
| `feature/m4-interviews-and-feedback` | `subfeat/m4-feedback-backend` | `4d06abbdabfd` |
| `feature/m4-live-collaboration` | `subfeat/m4-collaboration-ui` | `851a9680d0de` |
| `feature/m4-live-collaboration` | `subfeat/m4-excalidraw-redis` | `2da3a3a83975` |
| `feature/m4-live-collaboration` | `subfeat/m4-editor-redis` | `b24f7ccb1f26` |
| `feature/m4-live-collaboration` | `subfeat/m4-collaboration-backend` | `d3be83b3b9c5` |
| `feature/m4-live-collaboration` | `bugfix/m4-redis-backend-compatibility` | `0f6ad22f2590` |
| `feature/m4-live-collaboration` | `bugfix/m4-canvas-races` | `c7d15c016ecd` |
| `feature/m4-deployment` | `subfeat/m4-vps-and-configuration` | `06eb751e77bc` |
| `feature/m4-deployment` | `subfeat/m4-e2e-checks` | `79414b503fb2` |

## Storage and deployment decisions

- Excalidraw and the Redis canvas storage/race fixes are retained from deployment.
- Hocuspocus/Yjs remains the editor sync protocol; Redis replaces all editor SQLite storage.
- Code state/text/version use the existing Java Redis keys. Notes and private notes have independent state/text/version keys. Replay is an ordered Redis list and closed-room markers survive restarts.
- The four Java Redis files removed by the original commit are retained. RedisExpirationListner is adapted to the unified room end operation; the database scheduler remains authoritative. CollaborationGateway can recover text snapshots from Redis if editor HTTP flushing fails.
- Compose supplies EDITOR_REDIS_URL, waits for Redis readiness, checks editor health, and enables Redis AOF. Editor SQLite volumes and dependencies are removed.
- Deployment’s MySQL/VPS/Caddy configuration is preserved. Changes from the separate vercel-integration branch are outside this reconstruction.
- No migration of preexisting SQLite document/replay databases is performed. Back up existing SQLite volumes before replacing a running editor.

## Verification

- Frontend production build: passed.
- Editor and canvas TypeScript checks: passed.
- Editor Redis integration tests: 5 passed against a dedicated Redis database.
- Canvas regression tests: 5 passed.
- Backend Java 21 compilation: passed.
- Authenticated Hocuspocus edit/flush/replay, editor restart and ended-room read-only reconnect: passed.
- Redis server restart with AOF recovery: passed.
- Git audit: all children merged into their features, all features merged into milestone_4, revert restores the original base, main/deployment tips unchanged, and no unexpected differences from deployment.
- Full backend/application end-to-end suite was not run.

## File inventory

`milestone-4-files.tsv` lists every changed path compared with pre-Claude state, its Git status, line additions/deletions, feature, and child branch. Retained unchanged files such as DebounceRedisWriter.java are described above rather than counted as changed.

Backup branches: `archive/milestone-4-before-split` and `archive/deployment-before-split`. All new branches are local until explicitly pushed.

## History documentation

`subfeat/m4-branch-documentation` records this report and the file inventory and is merged into `feature/m4-deployment`, then into `milestone_4`. The scoped-diff table records the initial six feature merges; this documentation adds two files and one child branch to the deployment feature.
