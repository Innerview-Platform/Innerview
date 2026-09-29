import { resolve } from 'node:path'

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable ${name}`)
  return value
}

export const config = {
  port: Number(process.env.PORT ?? process.env.CANVAS_PORT ?? 5858),
  host: process.env.CANVAS_HOST ?? '0.0.0.0',
  /** Same secret the Spring backend signs access tokens with (HS256, raw UTF-8 bytes). */
  jwtSecret: required('JWT_SECRET'),
  /** Room documents (one SQLite file per room) and uploaded images live here. */
  dataDir: resolve(process.env.CANVAS_DATA_DIR ?? './data'),
  /** Browser origin(s) allowed to call the HTTP endpoints, comma separated. */
  corsOrigins: (process.env.FRONTEND_URL ?? 'http://localhost:3000').split(',').map((origin) => origin.trim()),
  /** Whiteboards of ended interviews are deleted after this many days. */
  retentionDays: Number(process.env.CANVAS_RETENTION_DAYS ?? 180),
  maxUploadBytes: Number(process.env.CANVAS_MAX_UPLOAD_MB ?? 10) * 1024 * 1024,
}
