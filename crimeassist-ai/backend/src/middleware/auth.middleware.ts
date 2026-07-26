import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { query } from '../services/database.service'
import { AppError } from './error.middleware'
import { logger } from '../utils/logger'

export interface JwtPayload {
  userId: string
  username: string
  email: string
  role: string
  stationId?: string
  districtId?: string
  iat?: number
  exp?: number
}

// Augment Express Request
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers['x-auth-token'] as string
    if (!token) {
      throw new AppError('Access token required', 401, 'UNAUTHORIZED')
    }

    const secret = process.env.JWT_ACCESS_SECRET
    if (!secret) throw new Error('JWT secret not configured')

    let decoded: JwtPayload
    try {
      decoded = jwt.verify(token, secret) as JwtPayload
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new AppError('Access token expired', 401, 'TOKEN_EXPIRED')
      }
      throw new AppError('Invalid access token', 401, 'INVALID_TOKEN')
    }

    // Verify user still exists and is active
    const result = await query(
      'SELECT id, role, status, badge_number FROM users WHERE id = $1',
      [decoded.userId]
    )

    if (result.rowCount === 0) {
      throw new AppError('User not found', 401, 'USER_NOT_FOUND')
    }

    const user = result.rows[0] as { id: string; role: string; status: string }
    if (user.status !== 'active') {
      throw new AppError('Account is not active', 403, 'ACCOUNT_INACTIVE')
    }

    req.user = { ...decoded, role: user.role }
    next()
  } catch (error) {
    next(error)
  }
}

// Optional auth — doesn't throw if no token
export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.headers['x-auth-token'] as string
  if (!token) {
    return next()
  }

  try {
    const secret = process.env.JWT_ACCESS_SECRET!
    req.user = jwt.verify(token, secret) as JwtPayload
  } catch {
    // Silently ignore invalid tokens for optional auth
  }
  next()
}

export function generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  const secret = process.env.JWT_ACCESS_SECRET
  if (!secret) throw new Error('JWT_ACCESS_SECRET not configured')
  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  } as jwt.SignOptions)
}

export function generateRefreshToken(userId: string): string {
  const secret = process.env.JWT_REFRESH_SECRET
  if (!secret) throw new Error('JWT_REFRESH_SECRET not configured')
  return jwt.sign({ userId }, secret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  } as jwt.SignOptions)
}

export function verifyRefreshToken(token: string): { userId: string } {
  const secret = process.env.JWT_REFRESH_SECRET
  if (!secret) throw new Error('JWT_REFRESH_SECRET not configured')
  return jwt.verify(token, secret) as { userId: string }
}
