# ──────────────────────────────────────────────
# Stage 1: Build the React / Vite application
# ──────────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

# Install pnpm (v9 matches lockfileVersion '9.0' and avoids v10 minimumReleaseAge policy)
RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy dependency manifests first (layer cache)
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the source
COPY . .

# Build for production.
# VITE_API_BASE_URL is intentionally left empty so the SPA calls /api/...
# on its own origin (nginx reverse-proxies to the backend).
ARG VITE_LIVEKIT_URL="ws://localhost:7880"
ENV VITE_API_BASE_URL=""
ENV VITE_LIVEKIT_URL=$VITE_LIVEKIT_URL
RUN pnpm run build

# ──────────────────────────────────────────────
# Stage 2: Serve with nginx
# ──────────────────────────────────────────────
FROM nginx:1.27-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built assets from stage 1
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
