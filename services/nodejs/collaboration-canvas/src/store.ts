import { createClient } from 'redis'
import { config } from './config.ts'

export const redis = createClient({ url: config.redisUrl, disableOfflineQueue: true })
redis.on('error', (error) => console.error('[canvas] Redis error', error))

const key = (roomId: string) => `room:${roomId}:canvas`
const endedRooms = 'canvas:closed-rooms'

export const store = {
  async load(roomId: string) {
    const data = await redis.hGetAll(key(roomId))
    return { scene: data.scene ?? null, closed: Boolean(data.closedAt) }
  },
  async save(roomId: string, scene: string) {
    await redis.hSet(key(roomId), 'scene', scene)
  },
  async closeRoom(roomId: string) {
    // Preserve the original end time when the backend retries its close hook.
    await redis.eval(`
      local added = redis.call('HSETNX', KEYS[1], 'closedAt', ARGV[1])
      if added == 1 then redis.call('ZADD', KEYS[2], ARGV[1], ARGV[2]) end
      return added
    `, { keys: [key(roomId), endedRooms], arguments: [String(Date.now()), roomId] })
  },
  async deleteOldRooms(days: number, isActive: (roomId: string) => boolean) {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
    const expired = await redis.zRangeByScore(endedRooms, '-inf', cutoff)
    let deleted = 0
    for (const roomId of expired) {
      if (isActive(roomId)) continue
      await redis.multi().del(key(roomId)).zRem(endedRooms, roomId).exec()
      deleted++
    }
    return deleted
  },
}
