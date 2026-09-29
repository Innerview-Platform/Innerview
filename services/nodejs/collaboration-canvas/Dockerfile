# Debian-based so better-sqlite3 installs its prebuilt glibc binary (no compiler toolchain needed).
FROM node:22-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY src ./src
ENV CANVAS_DATA_DIR=/data NODE_ENV=production
VOLUME /data
EXPOSE 5858
CMD ["node_modules/.bin/tsx", "src/index.ts"]
