import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { query } from '../services/database.service'
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../middleware/auth.middleware'
import { authenticate } from '../middleware/auth.middleware'
import { rateLimitAuth } from '../middleware/rateLimit.middleware'
import { validate } from '../middleware/validation.middleware'
import { AppError } from '../middleware/error.middleware'
import { writeAuditLog } from '../middleware/audit.middleware'
import { logger } from '../utils/logger'

const router = Router()

// ─── Validation Schemas ──────────────────────────────────────────────────────
const LoginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
  rememberMe: z.boolean().optional().default(false),
})

const RefreshSchema = z.object({
  refreshToken: z.string(),
})

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
})

// ─── POST /auth/login ────────────────────────────────────────────────────────
router.post('/login', rateLimitAuth, validate(LoginSchema), async (req, res) => {
  const { username, password, rememberMe } = req.body

  // Find user by username or email
  const result = await query(
    `SELECT u.id, u.username, u.email, u.password_hash, u.full_name, u.role,
            u.status, u.login_attempts, u.locked_until, u.badge_number,
            u.station_id, u.district_id, u.rank, u.avatar_url, u.two_factor_enabled,
            ps.name AS station_name, d.name AS district_name
     FROM users u
     LEFT JOIN police_stations ps ON ps.id = u.station_id
     LEFT JOIN districts d ON d.id = u.district_id
     WHERE u.username = $1 OR u.email = $1`,
    [username]
  )

  if (result.rowCount === 0) {
    // Don't reveal whether user exists
    throw new AppError('Invalid username or password', 401, 'INVALID_CREDENTIALS')
  }

  const user = result.rows[0] as {
    id: string; username: string; email: string; password_hash: string
    full_name: string; role: string; status: string; login_attempts: number
    locked_until: Date | null; badge_number: string; station_id: string
    district_id: string; rank: string; avatar_url: string
    two_factor_enabled: boolean; station_name: string; district_name: string
  }

  // Check if account is locked
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    const minutesLeft = Math.ceil(
      (new Date(user.locked_until).getTime() - Date.now()) / 60000
    )
    throw new AppError(
      `Account locked due to too many failed attempts. Try again in ${minutesLeft} minutes.`,
      423,
      'ACCOUNT_LOCKED'
    )
  }

  // Check account status
  if (user.status !== 'active') {
    throw new AppError(
      `Your account is ${user.status}. Contact administrator.`,
      403,
      'ACCOUNT_INACTIVE'
    )
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.password_hash)
  if (!isValid) {
    // Increment login attempts
    const attempts = user.login_attempts + 1
    const lockUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null

    await query(
      'UPDATE users SET login_attempts = $1, locked_until = $2 WHERE id = $3',
      [attempts, lockUntil, user.id]
    )

    await writeAuditLog({
      userId: user.id,
      action: 'LOGIN_FAILED',
      resourceType: 'auth',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'failure',
      errorMessage: 'Invalid password',
    })

    throw new AppError('Invalid username or password', 401, 'INVALID_CREDENTIALS')
  }

  // Generate tokens
  const tokenPayload = {
    userId: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    stationId: user.station_id,
    districtId: user.district_id,
  }

  const accessToken = generateAccessToken(tokenPayload)
  const refreshToken = generateRefreshToken(user.id)

  // Store refresh token hash
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10)
  await query(
    `UPDATE users SET
       login_attempts = 0,
       locked_until = NULL,
       last_login = NOW(),
       refresh_token_hash = $1
     WHERE id = $2`,
    [refreshTokenHash, user.id]
  )

  await writeAuditLog({
    userId: user.id,
    action: 'LOGIN_SUCCESS',
    resourceType: 'auth',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    status: 'success',
  })

  logger.info('User logged in', { userId: user.id, username: user.username })

  res.json({
    success: true,
    data: {
      accessToken,
      refreshToken: rememberMe ? refreshToken : undefined,
      expiresIn: 900, // 15 minutes
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        badgeNumber: user.badge_number,
        rank: user.rank,
        stationId: user.station_id,
        stationName: user.station_name,
        districtId: user.district_id,
        districtName: user.district_name,
        avatarUrl: user.avatar_url,
        twoFactorEnabled: user.two_factor_enabled,
      },
    },
  })
})

// ─── POST /auth/logout ───────────────────────────────────────────────────────
router.post('/logout', authenticate, async (req, res) => {
  await query(
    'UPDATE users SET refresh_token_hash = NULL WHERE id = $1',
    [req.user!.userId]
  )

  await writeAuditLog({
    userId: req.user!.userId,
    action: 'LOGOUT',
    resourceType: 'auth',
    ipAddress: req.ip,
    status: 'success',
  })

  res.json({ success: true, message: 'Logged out successfully' })
})

// ─── GET /auth/me ────────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  const result = await query(
    `SELECT u.id, u.username, u.email, u.full_name, u.role, u.status,
            u.badge_number, u.rank, u.phone, u.avatar_url, u.last_login,
            u.two_factor_enabled, u.preferences, u.created_at,
            u.station_id, u.district_id,
            ps.name AS station_name, d.name AS district_name
     FROM users u
     LEFT JOIN police_stations ps ON ps.id = u.station_id
     LEFT JOIN districts d ON d.id = u.district_id
     WHERE u.id = $1`,
    [req.user!.userId]
  )

  if (result.rowCount === 0) {
    throw new AppError('User not found', 404, 'NOT_FOUND')
  }

  const user = result.rows[0]
  res.json({ success: true, data: user })
})

// ─── POST /auth/refresh ──────────────────────────────────────────────────────
router.post('/refresh', validate(RefreshSchema), async (req, res) => {
  const { refreshToken } = req.body

  let decoded: { userId: string }
  try {
    decoded = verifyRefreshToken(refreshToken)
  } catch {
    throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN')
  }

  const result = await query(
    `SELECT id, username, email, role, status, refresh_token_hash,
            station_id, district_id FROM users WHERE id = $1`,
    [decoded.userId]
  )

  if (result.rowCount === 0) {
    throw new AppError('User not found', 401, 'INVALID_REFRESH_TOKEN')
  }

  const user = result.rows[0] as {
    id: string; username: string; email: string; role: string
    status: string; refresh_token_hash: string; station_id: string; district_id: string
  }

  if (user.status !== 'active') {
    throw new AppError('Account is not active', 403, 'ACCOUNT_INACTIVE')
  }

  // Verify token matches stored hash
  const isValid = await bcrypt.compare(refreshToken, user.refresh_token_hash || '')
  if (!isValid) {
    throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN')
  }

  // Generate new access token
  const accessToken = generateAccessToken({
    userId: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    stationId: user.station_id,
    districtId: user.district_id,
  })

  res.json({
    success: true,
    data: { accessToken, expiresIn: 900 },
  })
})

// ─── POST /auth/forgot-password ──────────────────────────────────────────────
router.post('/forgot-password', rateLimitAuth, validate(ForgotPasswordSchema), async (req, res) => {
  const { email } = req.body

  // Always return success to prevent email enumeration
  const result = await query(
    'SELECT id, full_name FROM users WHERE email = $1 AND status = $2',
    [email, 'active']
  )

  if (result.rowCount && result.rowCount > 0) {
    // TODO: Send reset email via nodemailer
    logger.info('Password reset requested', { email })
    await writeAuditLog({
      action: 'PASSWORD_RESET_REQUESTED',
      resourceType: 'auth',
      ipAddress: req.ip,
      status: 'success',
    })
  }

  res.json({
    success: true,
    message: 'If an account exists with that email, a reset link has been sent.',
  })
})

export default router
