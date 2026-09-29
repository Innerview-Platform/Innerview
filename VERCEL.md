# Vercel Services deployment

Create a Vercel project with its repository root as the project root and select the **Services** framework preset. The root `vercel.json` deploys the Vite frontend and three active backend services. Run `vercel dev` from the repository root to run the service routing locally.

The browser uses one origin. `/api/*`, `/ws-signal/*`, `/oauth2/*`, and `/login/oauth2/*` reach Spring Boot. `/canvas/connect/*` and `/canvas/uploads/*` reach the whiteboard. `/collab` and `/collab/replay/*` reach the editor. Other paths reach the frontend, including client-side routes. The Go session service and Python AI services have empty executable entrypoints and dependency manifests, so they are not deployed.

Vercel injects `EDITOR_URL` and `CANVAS_URL` into the backend, and `BACKEND_INTERNAL_URL` into the editor. These are service bindings; do not define them in project environment variables. The Java `collaboration.*-url` settings and editor snapshot client read these values at runtime. Both services still use localhost defaults for standalone Docker development.

Set the application secrets and external dependency settings in the Vercel project, including `JWT_SECRET`, `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `REDIS_HOST`, `REDIS_PORT`, and `FRONTEND_URL` (the public HTTPS origin). Configure the Google OAuth, SMTP, LiveKit, Piston, and DynamoDB settings for the features you use. Register the public `/login/oauth2/code/google` callback with Google. `VITE_LIVEKIT_URL` and `VITE_TLDRAW_LICENSE_KEY` are frontend build variables; service bindings are unavailable during that build.

The Docker Compose databases, Redis, Piston, and LiveKit services are not part of this Vercel deployment. They need reachable hosted replacements. The canvas and editor currently keep room state and uploaded files in local SQLite storage. Their Vercel containers write to temporary storage, so that state can disappear on restart or land on separate instances. Shared, durable storage and cross-instance room coordination are required before collaborative rooms can be considered production ready on Vercel.
