function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable ${name}`)
  return value
}

export const config = {
  port: Number(process.env.CANVAS_PORT ?? 5858),
  host: process.env.CANVAS_HOST ?? '0.0.0.0',
  /** Same secret the Spring backend signs access tokens with (HS256, raw UTF-8 bytes). */
  jwtSecret: required('JWT_SECRET'),
  redisUrl: process.env.CANVAS_REDIS_URL ?? `redis://${process.env.REDIS_HOST ?? 'localhost'}:${process.env.REDIS_PORT ?? 6379}`,
  /** Browser origin(s) allowed to call the HTTP endpoints, comma separated. */
  corsOrigins: (process.env.FRONTEND_URL ?? 'http://localhost:3000').split(',').map((origin) => origin.trim()),
  /** Whiteboards of ended interviews are deleted after this many days. */
  retentionDays: Number(process.env.CANVAS_RETENTION_DAYS ?? 180),
}
