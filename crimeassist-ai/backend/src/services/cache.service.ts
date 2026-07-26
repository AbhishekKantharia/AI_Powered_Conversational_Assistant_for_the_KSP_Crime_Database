import { createClient, RedisClientType } from 'redis'
import { logger } from '../utils/logger'

let redisClient: RedisClientType | null = null
const memoryCache = new Map<string, { value: unknown; expiresAt: number }>()

export async function initializeCache(): Promise<void> {
  if (process.env.REDIS_URL) {
    try {
      redisClient = createClient({
        url: process.env.REDIS_URL,
        password: process.env.REDIS_PASSWORD || undefined,
      }) as RedisClientType

      redisClient.on('error', (err) => logger.error('Redis error:', err))
      redisClient.on('connect', () => logger.info('Redis connected'))

      await redisClient.connect()
    } catch (err) {
      logger.warn('Redis connection failed, using in-memory cache:', err)
      redisClient = null
    }
  } else {
    logger.info('No REDIS_URL configured, using in-memory cache')
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (redisClient) {
    try {
      const value = await redisClient.get(key)
      return value ? JSON.parse(value) : null
    } catch {
      return null
    }
  }

  const entry = memoryCache.get(key)
  if (entry && Date.now() < entry.expiresAt) {
    return entry.value as T
  }
  memoryCache.delete(key)
  return null
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number = 3600): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(value))
    } catch (err) {
      logger.warn('Cache set failed:', err)
    }
    return
  }

  memoryCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
}

export async function cacheDelete(pattern: string): Promise<void> {
  if (redisClient) {
    try {
      const keys = await redisClient.keys(pattern)
      if (keys.length > 0) await redisClient.del(keys)
    } catch {}
    return
  }

  for (const key of memoryCache.keys()) {
    if (key.includes(pattern.replace('*', ''))) {
      memoryCache.delete(key)
    }
  }
}

export async function disconnectCache(): Promise<void> {
  if (redisClient) {
    await redisClient.disconnect()
  }
}

// Cache middleware factory
export function withCache(keyFn: (req: unknown) => string, ttl: number = 300) {
  return async (req: unknown, res: unknown, next: () => void) => {
    const key = keyFn(req)
    const cached = await cacheGet(key)
    if (cached) {
      ;(res as { json: (data: unknown) => void }).json({ success: true, data: cached, cached: true })
      return
    }
    const origJson = (res as { json: (data: unknown) => void }).json.bind(res)
    ;(res as { json: (data: unknown) => void }).json = (data: unknown) => {
      const d = data as { success?: boolean; data?: unknown }
      if (d?.success && d?.data) {
        cacheSet(key, d.data, ttl)
      }
      return origJson(data)
    }
    next()
  }
}
