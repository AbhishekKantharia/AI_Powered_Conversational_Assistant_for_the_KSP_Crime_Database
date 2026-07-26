import { Router } from 'express'
import { z } from 'zod'
import { authenticate } from '../middleware/auth.middleware'
import { requirePermission } from '../middleware/rbac.middleware'
import { rateLimitGeneral } from '../middleware/rateLimit.middleware'
import { validate, PaginationSchema, UUIDSchema } from '../middleware/validation.middleware'
import { query, buildPagination, buildPaginatedResponse } from '../services/database.service'
import { AppError } from '../middleware/error.middleware'
import { writeAuditLog } from '../middleware/audit.middleware'

const router = Router()
router.use(authenticate, rateLimitGeneral)

// ─── Schemas ─────────────────────────────────────────────────────────────────
const CriminalFilterSchema = PaginationSchema.extend({
  riskLevel: z.string().optional(),
  isWanted: z.coerce.boolean().optional(),
  isArrested: z.coerce.boolean().optional(),
  districtId: z.string().uuid().optional(),
  search: z.string().max(200).optional(),
  gender: z.string().optional(),
})

const CreateCriminalSchema = z.object({
  fullName: z.string().min(2).max(150),
  aliases: z.array(z.string()).optional(),
  dateOfBirth: z.string().optional(),
  age: z.number().int().optional(),
  gender: z.enum(['male', 'female', 'other', 'unknown']).default('male'),
  nationality: z.string().default('Indian'),
  education: z.string().optional(),
  occupation: z.string().optional(),
  address: z.string().optional(),
  districtId: z.string().uuid().optional(),
  phone: z.string().optional(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  isWanted: z.boolean().default(false),
  rewardAmount: z.number().optional(),
  modusOperandi: z.string().optional(),
  crimeSpecialization: z.array(z.string()).optional(),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
})

// ─── GET /criminals ──────────────────────────────────────────────────────────
router.get('/', requirePermission('criminals:read'), validate(CriminalFilterSchema, 'query'), async (req, res) => {
  const { page, limit, offset } = buildPagination(req.query as unknown as { page?: number; limit?: number })
  const { riskLevel, isWanted, isArrested, districtId, search, gender, sortBy, sortOrder } = req.query as Record<string, string>

  const conditions: string[] = []
  const params: unknown[] = []
  let idx = 1

  if (riskLevel) { conditions.push(`cr.risk_level = $${idx++}`); params.push(riskLevel) }
  if (isWanted !== undefined) { conditions.push(`cr.is_wanted = $${idx++}`); params.push(isWanted === 'true') }
  if (isArrested !== undefined) { conditions.push(`cr.is_arrested = $${idx++}`); params.push(isArrested === 'true') }
  if (districtId) { conditions.push(`cr.district_id = $${idx++}`); params.push(districtId) }
  if (gender) { conditions.push(`cr.gender = $${idx++}`); params.push(gender) }
  if (search) {
    conditions.push(`(cr.full_name ILIKE $${idx} OR cr.criminal_id ILIKE $${idx} OR $${idx} = ANY(cr.aliases::text[]))`)
    params.push(`%${search}%`)
    idx++
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const orderField = sortBy === 'risk' ? 'cr.risk_score' : sortBy === 'name' ? 'cr.full_name' : 'cr.created_at'
  const orderDir = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

  const [rows, count] = await Promise.all([
    query(
      `SELECT cr.id, cr.criminal_id, cr.full_name, cr.aliases, cr.age, cr.gender,
              cr.risk_level, cr.risk_score, cr.is_wanted, cr.is_arrested, cr.is_absconding,
              cr.reward_amount, cr.photo_url, cr.total_cases, cr.total_convictions,
              cr.active_cases, cr.crime_specialization, cr.last_known_location,
              d.name AS district_name, cr.created_at
       FROM criminals cr
       LEFT JOIN districts d ON d.id = cr.district_id
       ${whereClause}
       ORDER BY ${orderField} ${orderDir}
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    ),
    query(`SELECT COUNT(*) FROM criminals cr ${whereClause}`, params),
  ])

  const total = parseInt((count.rows[0] as { count: string }).count)
  res.json({ success: true, ...buildPaginatedResponse(rows.rows, total, page, limit) })
})

// ─── GET /criminals/:id ──────────────────────────────────────────────────────
router.get('/:id', requirePermission('criminals:read'), validate(UUIDSchema, 'params'), async (req, res) => {
  const [criminal, cases] = await Promise.all([
    query(
      `SELECT cr.*, d.name AS district_name
       FROM criminals cr
       LEFT JOIN districts d ON d.id = cr.district_id
       WHERE cr.id = $1`,
      [req.params.id]
    ),
    query(
      `SELECT c.id, c.case_number, c.title, c.crime_category, c.status, c.case_registered_date,
              s.role_in_crime, s.is_arrested AS suspect_arrested
       FROM suspects s
       JOIN cases c ON c.id = s.case_id
       WHERE s.criminal_id = $1
       ORDER BY c.case_registered_date DESC`,
      [req.params.id]
    ),
  ])

  if (criminal.rowCount === 0) throw new AppError('Criminal not found', 404, 'NOT_FOUND')

  res.json({ success: true, data: { ...criminal.rows[0], cases: cases.rows } })
})

// ─── POST /criminals ─────────────────────────────────────────────────────────
router.post('/', requirePermission('criminals:create'), validate(CreateCriminalSchema), async (req, res) => {
  const criminalId = `KSP-CR-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`

  const {
    fullName, aliases, dateOfBirth, age, gender, nationality, education, occupation,
    address, districtId, phone, riskLevel, isWanted, rewardAmount, modusOperandi,
    crimeSpecialization, fatherName, motherName
  } = req.body

  // Calculate risk score from risk level
  const riskScoreMap: Record<string, number> = { low: 25, medium: 50, high: 75, critical: 95 }
  const riskScore = riskScoreMap[riskLevel] || 50

  const result = await query(
    `INSERT INTO criminals
     (criminal_id, full_name, aliases, date_of_birth, age, gender, nationality,
      education, occupation, address, district_id, phone, risk_level, risk_score,
      is_wanted, reward_amount, modus_operandi, crime_specialization,
      father_name, mother_name)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
     RETURNING *`,
    [criminalId, fullName, aliases || [], dateOfBirth || null, age || null, gender,
     nationality, education || null, occupation || null, address || null,
     districtId || null, phone || null, riskLevel, riskScore, isWanted || false,
     rewardAmount || null, modusOperandi || null, crimeSpecialization || [],
     fatherName || null, motherName || null]
  )

  await writeAuditLog({
    userId: req.user!.userId,
    action: 'CREATE_CRIMINAL',
    resourceType: 'criminals',
    resourceId: result.rows[0].id,
    newValues: req.body,
    ipAddress: req.ip,
    status: 'success',
  })

  res.status(201).json({ success: true, data: result.rows[0] })
})

// ─── PUT /criminals/:id ───────────────────────────────────────────────────────
router.put('/:id', requirePermission('criminals:update'), validate(UUIDSchema, 'params'), async (req, res) => {
  const existing = await query('SELECT * FROM criminals WHERE id = $1', [req.params.id])
  if (existing.rowCount === 0) throw new AppError('Criminal not found', 404, 'NOT_FOUND')

  const {
    fullName, aliases, riskLevel, isWanted, isArrested, isAbsconding,
    lastKnownLocation, rewardAmount, address, phone, crimeSpecialization
  } = req.body

  const riskScoreMap: Record<string, number> = { low: 25, medium: 50, high: 75, critical: 95 }

  const result = await query(
    `UPDATE criminals SET
       full_name = COALESCE($1, full_name),
       aliases = COALESCE($2, aliases),
       risk_level = COALESCE($3, risk_level),
       risk_score = COALESCE($4, risk_score),
       is_wanted = COALESCE($5, is_wanted),
       is_arrested = COALESCE($6, is_arrested),
       is_absconding = COALESCE($7, is_absconding),
       last_known_location = COALESCE($8, last_known_location),
       reward_amount = COALESCE($9, reward_amount),
       address = COALESCE($10, address),
       phone = COALESCE($11, phone),
       crime_specialization = COALESCE($12, crime_specialization),
       updated_at = NOW()
     WHERE id = $13 RETURNING *`,
    [fullName, aliases, riskLevel, riskLevel ? riskScoreMap[riskLevel] : null,
     isWanted, isArrested, isAbsconding, lastKnownLocation, rewardAmount,
     address, phone, crimeSpecialization, req.params.id]
  )

  await writeAuditLog({
    userId: req.user!.userId,
    action: 'UPDATE_CRIMINAL',
    resourceType: 'criminals',
    resourceId: req.params.id,
    oldValues: existing.rows[0],
    newValues: req.body,
    ipAddress: req.ip,
    status: 'success',
  })

  res.json({ success: true, data: result.rows[0] })
})

// ─── GET /criminals/wanted ────────────────────────────────────────────────────
router.get('/wanted', requirePermission('criminals:read'), async (_req, res) => {
  const result = await query(`SELECT * FROM v_wanted_criminals LIMIT 50`)
  res.json({ success: true, data: result.rows })
})

// ─── DELETE /criminals/:id ────────────────────────────────────────────────────
router.delete('/:id', requirePermission('criminals:delete'), validate(UUIDSchema, 'params'), async (req, res) => {
  const existing = await query('SELECT * FROM criminals WHERE id = $1', [req.params.id])
  if (existing.rowCount === 0) throw new AppError('Criminal not found', 404, 'NOT_FOUND')

  await query('DELETE FROM suspects WHERE criminal_id = $1', [req.params.id])
  await query('DELETE FROM criminals WHERE id = $1', [req.params.id])

  await writeAuditLog({
    userId: req.user!.userId,
    action: 'DELETE_CRIMINAL',
    resourceType: 'criminals',
    resourceId: req.params.id,
    oldValues: existing.rows[0],
    ipAddress: req.ip,
    status: 'success',
  })

  res.json({ success: true, message: 'Criminal record deleted' })
})

export default router
