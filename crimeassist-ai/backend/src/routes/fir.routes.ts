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
const FIRFilterSchema = PaginationSchema.extend({
  districtId: z.string().uuid().optional(),
  stationId: z.string().uuid().optional(),
  crimeCategory: z.string().optional(),
  status: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().max(200).optional(),
  officerId: z.string().uuid().optional(),
})

const CreateFIRSchema = z.object({
  stationId: z.string().uuid(),
  districtId: z.string().uuid(),
  complainantName: z.string().min(2).max(150),
  complainantPhone: z.string().optional(),
  complainantAddress: z.string().optional(),
  complainantGender: z.string().optional(),
  complainantAge: z.number().int().optional(),
  incidentDate: z.string().datetime(),
  incidentLocation: z.string().min(5),
  crimeCategory: z.string(),
  crimeDescription: z.string().min(10),
  ipcSections: z.array(z.string()).optional(),
  accusedKnown: z.boolean().optional().default(false),
  accusedDescription: z.string().optional(),
  propertyLost: z.string().optional(),
  propertyValue: z.number().optional(),
})

// ─── GET /fir ─────────────────────────────────────────────────────────────────
router.get('/', requirePermission('fir:read'), validate(FIRFilterSchema, 'query'), async (req, res) => {
  const { page, limit, offset } = buildPagination(req.query as unknown as { page?: number; limit?: number })
  const { districtId, stationId, crimeCategory, status, dateFrom, dateTo, search, officerId, sortBy, sortOrder } = req.query as Record<string, string>

  const conditions: string[] = []
  const params: unknown[] = []
  let idx = 1

  if (req.user!.role === 'police_officer') {
    conditions.push(`f.station_id = $${idx++}`)
    params.push(req.user!.stationId)
  }

  if (districtId) { conditions.push(`f.district_id = $${idx++}`); params.push(districtId) }
  if (stationId) { conditions.push(`f.station_id = $${idx++}`); params.push(stationId) }
  if (crimeCategory) { conditions.push(`f.crime_category = $${idx++}`); params.push(crimeCategory) }
  if (status) { conditions.push(`f.status = $${idx++}`); params.push(status) }
  if (officerId) { conditions.push(`f.investigation_officer_id = $${idx++}`); params.push(officerId) }
  if (dateFrom) { conditions.push(`f.incident_date >= $${idx++}`); params.push(dateFrom) }
  if (dateTo) { conditions.push(`f.incident_date <= $${idx++}`); params.push(dateTo) }
  if (search) {
    conditions.push(`(f.fir_number ILIKE $${idx} OR f.complainant_name ILIKE $${idx} OR f.crime_description ILIKE $${idx} OR f.incident_location ILIKE $${idx})`)
    params.push(`%${search}%`)
    idx++
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const orderField = sortBy === 'date' ? 'f.incident_date' : 'f.created_at'
  const orderDir = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

  const [rows, count] = await Promise.all([
    query(
      `SELECT f.id, f.fir_number, f.complainant_name, f.complainant_phone,
              f.incident_date, f.incident_location, f.crime_category, f.status,
              f.accused_known, f.is_duplicate, f.property_value,
              d.name AS district_name, ps.name AS station_name,
              u.full_name AS investigation_officer, u.badge_number AS officer_badge,
              f.created_at
       FROM fir f
       LEFT JOIN districts d ON d.id = f.district_id
       LEFT JOIN police_stations ps ON ps.id = f.station_id
       LEFT JOIN users u ON u.id = f.investigation_officer_id
       ${whereClause}
       ORDER BY ${orderField} ${orderDir}
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    ),
    query(`SELECT COUNT(*) FROM fir f ${whereClause}`, params),
  ])

  const total = parseInt((count.rows[0] as { count: string }).count)
  res.json({ success: true, ...buildPaginatedResponse(rows.rows, total, page, limit) })
})

// ─── GET /fir/:id ─────────────────────────────────────────────────────────────
router.get('/:id', requirePermission('fir:read'), validate(UUIDSchema, 'params'), async (req, res) => {
  const result = await query(
    `SELECT f.*, d.name AS district_name, ps.name AS station_name,
            u1.full_name AS registered_by_name, u2.full_name AS investigation_officer_name,
            u2.badge_number AS officer_badge, u2.rank AS officer_rank
     FROM fir f
     LEFT JOIN districts d ON d.id = f.district_id
     LEFT JOIN police_stations ps ON ps.id = f.station_id
     LEFT JOIN users u1 ON u1.id = f.registered_by
     LEFT JOIN users u2 ON u2.id = f.investigation_officer_id
     WHERE f.id = $1`,
    [req.params.id]
  )
  if (result.rowCount === 0) throw new AppError('FIR not found', 404, 'NOT_FOUND')
  res.json({ success: true, data: result.rows[0] })
})

// ─── POST /fir ────────────────────────────────────────────────────────────────
router.post('/', requirePermission('fir:create'), validate(CreateFIRSchema), async (req, res) => {
  const year = new Date().getFullYear()
  const firNumber = `FIR/${req.body.stationId.slice(0, 4).toUpperCase()}/${year}/${String(Date.now()).slice(-5)}`

  const {
    stationId, districtId, complainantName, complainantPhone, complainantAddress,
    complainantGender, complainantAge, incidentDate, incidentLocation, crimeCategory,
    crimeDescription, ipcSections, accusedKnown, accusedDescription, propertyLost, propertyValue
  } = req.body

  const result = await query(
    `INSERT INTO fir
     (fir_number, station_id, district_id, complainant_name, complainant_phone,
      complainant_address, complainant_gender, complainant_age, incident_date,
      incident_location, crime_category, crime_description, ipc_sections,
      accused_known, accused_description, property_lost, property_value,
      registered_by, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,'filed')
     RETURNING *`,
    [firNumber, stationId, districtId, complainantName, complainantPhone || null,
     complainantAddress || null, complainantGender || null, complainantAge || null,
     incidentDate, incidentLocation, crimeCategory, crimeDescription,
     ipcSections || [], accusedKnown || false, accusedDescription || null,
     propertyLost || null, propertyValue || null, req.user!.userId]
  )

  await writeAuditLog({
    userId: req.user!.userId,
    action: 'CREATE_FIR',
    resourceType: 'fir',
    resourceId: result.rows[0].id,
    newValues: req.body,
    ipAddress: req.ip,
    status: 'success',
  })

  res.status(201).json({ success: true, data: result.rows[0] })
})

// ─── PUT /fir/:id ─────────────────────────────────────────────────────────────
router.put('/:id', requirePermission('fir:update'), validate(UUIDSchema, 'params'), async (req, res) => {
  const existing = await query('SELECT * FROM fir WHERE id = $1', [req.params.id])
  if (existing.rowCount === 0) throw new AppError('FIR not found', 404, 'NOT_FOUND')

  const { status, investigationOfficerId, crimeDescription } = req.body

  const result = await query(
    `UPDATE fir SET
       status = COALESCE($1, status),
       investigation_officer_id = COALESCE($2, investigation_officer_id),
       crime_description = COALESCE($3, crime_description),
       updated_at = NOW()
     WHERE id = $4 RETURNING *`,
    [status, investigationOfficerId || null, crimeDescription, req.params.id]
  )

  await writeAuditLog({
    userId: req.user!.userId,
    action: 'UPDATE_FIR',
    resourceType: 'fir',
    resourceId: req.params.id,
    oldValues: existing.rows[0],
    newValues: req.body,
    ipAddress: req.ip,
    status: 'success',
  })

  res.json({ success: true, data: result.rows[0] })
})

// ─── DELETE /fir/:id ──────────────────────────────────────────────────────────
router.delete('/:id', requirePermission('fir:delete'), validate(UUIDSchema, 'params'), async (req, res) => {
  const existing = await query('SELECT id FROM fir WHERE id = $1', [req.params.id])
  if (existing.rowCount === 0) throw new AppError('FIR not found', 404, 'NOT_FOUND')

  await query('DELETE FROM fir WHERE id = $1', [req.params.id])
  await writeAuditLog({
    userId: req.user!.userId,
    action: 'DELETE_FIR',
    resourceType: 'fir',
    resourceId: req.params.id,
    ipAddress: req.ip,
    status: 'success',
  })

  res.json({ success: true, message: 'FIR deleted' })
})

export default router
