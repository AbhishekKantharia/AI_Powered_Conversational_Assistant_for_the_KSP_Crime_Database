import { Request, Response, NextFunction } from 'express'
import { RateLimiterMemory, RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible'
import { createClient } from 'redis'
import { logger } from '../utils/logger'
import { AppError } from './error.middleware'

let rateLimiterGeneral: RateLimiterMemory
let rateLimiterAI: RateLimiterMemory
let rateLimiterAuth: RateLimiterMemory
let rateLimiterStrict: RateLimiterMemory

export function setupRateLimiters(): void {
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000 // Convert to seconds
  const max = parseInt(process.env.RATE_LIMIT_MAX || '100')
  const aiMax = parseInt(process.env.AI_RATE_LIMIT_MAX || '20')

  rateLimiterGeneral = new RateLimiterMemory({
    keyPrefix: 'general',
    points: max,
    duration: windowMs,
  })

  rateLimiterAI = new RateLimiterMemory({
    keyPrefix: 'ai',
    points: aiMax,
    duration: 60, // 1 minute
  })

  rateLimiterAuth = new RateLimiterMemory({
    keyPrefix: 'auth',
    points: 10,
    duration: 900, // 15 minutes
    blockDuration: 900, // Block for 15 min on breach
  })

  rateLimiterStrict = new RateLimiterMemory({
    keyPrefix: 'strict',
    points: 5,
    duration: 900,
    blockDuration: 3600, // Block for 1 hour on breach
  })

  logger.info('Rate limiters configured')
}

function handleRateLimitError(err: unknown, res: Response, limiterRes?: RateLimiterRes): void {
  if (err instanceof Error && (err as NodeJS.ErrnoException).name === 'Error') {
    const retryAfter = limiterRes ? Math.ceil(limiterRes.msBeforeNext / 1000) : 60
    res.set('Retry-After', String(retryAfter))
    res.set('X-RateLimit-Limit', '100')
    res.set('X-RateLimit-Remaining', '0')
    res.set('X-RateLimit-Reset', new Date(Date.now() + (limiterRes?.msBeforeNext || 60000)).toISOString())
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Too many requests. Try again in ${retryAfter} seconds.`,
      },
    })
  }
}

export const rateLimitGeneral = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const key = req.user?.userId || req.ip || 'anonymous'
  try {
    const rateLimiterRes = await rateLimiterGeneral.consume(key)
    res.set('X-RateLimit-Remaining', String(rateLimiterRes.remainingPoints))
    next()
  } catch (err) {
    handleRateLimitError(err, res, err as RateLimiterRes)
  }
}

export const rateLimitAI = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const key = `ai_${req.user?.userId || req.ip}`
  try {
    await rateLimiterAI.consume(key)
    next()
  } catch (err) {
    handleRateLimitError(err, res, err as RateLimiterRes)
  }
}

export const rateLimitAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const key = `auth_${req.ip}`
  try {
    await rateLimiterAuth.consume(key)
    next()
  } catch (err) {
    logger.warn('Auth rate limit exceeded', { ip: req.ip })
    handleRateLimitError(err, res, err as RateLimiterRes)
  }
}

export const rateLimitStrict = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const key = `strict_${req.ip}`
  try {
    await rateLimiterStrict.consume(key)
    next()
  } catch (err) {
    logger.warn('Strict rate limit exceeded', { ip: req.ip, path: req.path })
    handleRateLimitError(err, res, err as RateLimiterRes)
  }
}
