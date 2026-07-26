import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { rateLimitGeneral } from '../middleware/rateLimit.middleware'
import { query } from '../services/database.service'
import { AppError } from '../middleware/error.middleware'
import { aiService } from '../services/ai.service'
import { getPublicReports, getPublicReportById } from '../services/publicSeedData.service'

const router = Router()
router.use(authenticate, rateLimitGeneral)

// ─── POST /reports ─────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { title, type, districtId, stationId, dateFrom, dateTo, parameters } = req.body

  const result = await query(
    `INSERT INTO reports (title, type, generated_by, district_id, station_id, date_from, date_to, parameters, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending')
     RETURNING *`,
    [title, type, req.user!.userId, districtId || null, stationId || null,
     dateFrom || null, dateTo || null, JSON.stringify(parameters || {})]
  )

  // In production: trigger async report generation job
  res.status(201).json({
    success: true,
    data: result.rows[0],
    message: 'Report generation started. Download will be available shortly.',
  })
})

// ─── GET /reports ──────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const result = await query(
    `SELECT r.*, u.full_name AS generated_by_name
     FROM reports r LEFT JOIN users u ON u.id = r.generated_by
     WHERE r.generated_by = $1 OR $2 = 'administrator'
     ORDER BY r.created_at DESC LIMIT 50`,
    [req.user!.userId, req.user!.role]
  )
  // Fallback to public data when DB is empty
  if (result.rowCount === 0) {
    return res.json({ success: true, data: getPublicReports() })
  }
  res.json({ success: true, data: result.rows })
})

// ─── GET /reports/:id ──────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const result = await query('SELECT * FROM reports WHERE id = $1', [req.params.id])
  if (result.rowCount === 0) {
    // Fallback to public data
    const pubReport = getPublicReportById(req.params.id)
    if (pubReport) return res.json({ success: true, data: pubReport })
    throw new AppError('Report not found', 404, 'NOT_FOUND')
  }
  res.json({ success: true, data: result.rows[0] })
})

// ─── DELETE /reports/:id ───────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  await query('DELETE FROM reports WHERE id = $1 AND generated_by = $2', [req.params.id, req.user!.userId])
  res.json({ success: true, message: 'Report deleted' })
})

export default router
