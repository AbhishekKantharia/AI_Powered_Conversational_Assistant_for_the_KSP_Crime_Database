import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { rateLimitGeneral } from '../middleware/rateLimit.middleware'
import { query } from '../services/database.service'

const router = Router()
router.use(authenticate, rateLimitGeneral)

// ─── GET /settings ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const userResult = await query(
    `SELECT id, username, email, full_name, role, badge_number, rank, phone, avatar_url,
            preferences, two_factor_enabled, created_at, last_login
     FROM users WHERE id = $1`,
    [req.user!.userId]
  )

  const districtsResult = await query('SELECT id, name, code FROM districts ORDER BY name')
  const stationsResult = await query(
    `SELECT ps.id, ps.name, ps.code, d.name AS district_name
     FROM police_stations ps JOIN districts d ON d.id = ps.district_id
     ORDER BY ps.name`
  )

  res.json({
    success: true,
    data: {
      profile: userResult.rows[0],
      districts: districtsResult.rows,
      stations: stationsResult.rows,
    },
  })
})

// ─── PUT /settings/profile ─────────────────────────────────────────────────────
router.put('/profile', async (req, res) => {
  const { fullName, phone, preferences } = req.body

  const result = await query(
    `UPDATE users SET
       full_name = COALESCE($1, full_name),
       phone = COALESCE($2, phone),
       preferences = COALESCE($3, preferences),
       updated_at = NOW()
     WHERE id = $4 RETURNING id, username, email, full_name, phone, preferences`,
    [fullName, phone, preferences ? JSON.stringify(preferences) : null, req.user!.userId]
  )

  res.json({ success: true, data: result.rows[0] })
})

export default router
