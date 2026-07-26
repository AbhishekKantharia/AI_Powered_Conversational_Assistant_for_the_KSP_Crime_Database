import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { authenticate } from '../middleware/auth.middleware'
import { requireAdmin, requirePermission } from '../middleware/rbac.middleware'
import { rateLimitGeneral } from '../middleware/rateLimit.middleware'
import { validate, PaginationSchema, UUIDSchema } from '../middleware/validation.middleware'
import { query, buildPagination, buildPaginatedResponse } from '../services/database.service'
import { AppError } from '../middleware/error.middleware'
import { writeAuditLog } from '../middleware/audit.middleware'

const router = Router()
router.use(authenticate, rateLimitGeneral)

const CreateUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  fullName: z.string().min(2).max(150),
  role: z.enum(['administrator', 'police_officer', 'investigation_officer', 'crime_analyst']),
  badgeNumber: z.string().min(3).max(20),
  rank: z.string().optional(),
  phone: z.string().optional(),
  stationId: z.string().uuid().optional(),
  districtId: z.string().uuid().optional(),
})

const UpdateUserSchema = CreateUserSchema.omit({ password: true }).partial()

// ─── GET /users ───────────────────────────────────────────────────────────────
router.get('/', requirePermission('users:read'), validate(PaginationSchema, 'query'), async (req, res) => {
  const { page, limit, offset } = buildPagination(req.query as unknown as { page?: number; limit?: number })
  const search = req.query.search as string | undefined
  const role = req.query.role as string | undefined

  const conditions: string[] = []
  const params: unknown[] = []
  let idx = 1

  if (role) { conditions.push(`u.role = $${idx++}`); params.push(role) }
  if (search) {
    conditions.push(`(u.full_name ILIKE $${idx} OR u.username ILIKE $${idx} OR u.badge_number ILIKE $${idx})`)
    params.push(`%${search}%`)
    idx++
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const [rows, count] = await Promise.all([
    query(
      `SELECT u.id, u.username, u.email, u.full_name, u.role, u.status,
              u.badge_number, u.rank, u.phone, u.last_login, u.created_at,
              ps.name AS station_name, d.name AS district_name
       FROM users u
       LEFT JOIN police_stations ps ON ps.id = u.station_id
       LEFT JOIN districts d ON d.id = u.district_id
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    ),
    query(`SELECT COUNT(*) FROM users u ${whereClause}`, params),
  ])

  const total = parseInt((count.rows[0] as { count: string }).count)
  res.json({ success: true, ...buildPaginatedResponse(rows.rows, total, page, limit) })
})

// ─── POST /users ──────────────────────────────────────────────────────────────
router.post('/', requirePermission('users:create'), validate(CreateUserSchema), async (req, res) => {
  const { username, email, password, fullName, role, badgeNumber, rank, phone, stationId, districtId } = req.body

  // Check unique constraints
  const existing = await query('SELECT id FROM users WHERE username = $1 OR email = $2 OR badge_number = $3', [username, email, badgeNumber])
  if (existing.rowCount && existing.rowCount > 0) {
    throw new AppError('Username, email, or badge number already exists', 409, 'DUPLICATE_USER')
  }

  const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || '12'))

  const result = await query(
    `INSERT INTO users (username, email, password_hash, full_name, role, badge_number, rank, phone, station_id, district_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id, username, email, full_name, role, badge_number, created_at`,
    [username, email, passwordHash, fullName, role, badgeNumber, rank || null, phone || null, stationId || null, districtId || null]
  )

  await writeAuditLog({
    userId: req.user!.userId,
    action: 'CREATE_USER',
    resourceType: 'users',
    resourceId: result.rows[0].id as string,
    newValues: { username, email, role, badgeNumber },
    ipAddress: req.ip,
    status: 'success',
  })

  res.status(201).json({ success: true, data: result.rows[0] })
})

// ─── PUT /users/:id ───────────────────────────────────────────────────────────
router.put('/:id', requirePermission('users:update'), validate(UUIDSchema, 'params'), validate(UpdateUserSchema), async (req, res) => {
  const { fullName, role, status, rank, phone, stationId, districtId } = req.body

  const result = await query(
    `UPDATE users SET
       full_name = COALESCE($1, full_name),
       role = COALESCE($2, role),
       status = COALESCE($3, status),
       rank = COALESCE($4, rank),
       phone = COALESCE($5, phone),
       station_id = COALESCE($6, station_id),
       district_id = COALESCE($7, district_id),
       updated_at = NOW()
     WHERE id = $8 RETURNING id, username, email, full_name, role, status, badge_number`,
    [fullName, role, status, rank, phone, stationId, districtId, req.params.id]
  )

  if (result.rowCount === 0) throw new AppError('User not found', 404, 'NOT_FOUND')

  await writeAuditLog({
    userId: req.user!.userId,
    action: 'UPDATE_USER',
    resourceType: 'users',
    resourceId: req.params.id,
    newValues: req.body,
    ipAddress: req.ip,
    status: 'success',
  })

  res.json({ success: true, data: result.rows[0] })
})

// ─── DELETE /users/:id ────────────────────────────────────────────────────────
router.delete('/:id', requirePermission('users:delete'), validate(UUIDSchema, 'params'), async (req, res) => {
  if (req.params.id === req.user!.userId) {
    throw new AppError('Cannot delete your own account', 400, 'SELF_DELETE')
  }

  const existing = await query('SELECT id FROM users WHERE id = $1', [req.params.id])
  if (existing.rowCount === 0) throw new AppError('User not found', 404, 'NOT_FOUND')

  // Soft delete
  await query('UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2', ['inactive', req.params.id])

  await writeAuditLog({
    userId: req.user!.userId,
    action: 'DELETE_USER',
    resourceType: 'users',
    resourceId: req.params.id,
    ipAddress: req.ip,
    status: 'success',
  })

  res.json({ success: true, message: 'User deactivated' })
})

// ─── GET /users/audit-logs ────────────────────────────────────────────────────
router.get('/audit-logs', requirePermission('audit:read'), validate(PaginationSchema, 'query'), async (req, res) => {
  const { page, limit, offset } = buildPagination(req.query as unknown as { page?: number; limit?: number })

  const [rows, count] = await Promise.all([
    query(
      `SELECT al.*, u.full_name AS user_name, u.badge_number
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       ORDER BY al.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),
    query('SELECT COUNT(*) FROM audit_logs'),
  ])

  const total = parseInt((count.rows[0] as { count: string }).count)
  res.json({ success: true, ...buildPaginatedResponse(rows.rows, total, page, limit) })
})

export default router
