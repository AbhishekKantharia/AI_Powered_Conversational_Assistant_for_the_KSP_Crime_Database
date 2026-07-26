import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { requirePermission } from '../middleware/rbac.middleware'
import { rateLimitGeneral } from '../middleware/rateLimit.middleware'
import { validate } from '../middleware/validation.middleware'
import { query } from '../services/database.service'
import { z } from 'zod'

const router = Router()
router.use(authenticate, rateLimitGeneral)

const AnalyticsQuerySchema = z.object({
  districtId: z.string().uuid().optional(),
  year: z.coerce.number().int().min(2000).max(2030).optional(),
  period: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']).default('monthly'),
})

// ─── GET /analytics/dashboard ─────────────────────────────────────────────────
router.get('/dashboard', requirePermission('analytics:read'), async (req, res) => {
  const [stats, recentCases, topDistricts, crimeByCategory, monthlyTrend] = await Promise.all([
    // Dashboard stats
    query(`SELECT * FROM v_dashboard_stats LIMIT 1`),

    // Recent cases (last 10)
    query(
      `SELECT c.id, c.case_number, c.title, c.crime_category, c.status,
              c.priority, c.case_registered_date, c.ai_risk_score,
              d.name AS district_name, u.full_name AS officer_name
       FROM cases c
       LEFT JOIN districts d ON d.id = c.district_id
       LEFT JOIN users u ON u.id = c.assigned_officer_id
       ORDER BY c.created_at DESC LIMIT 10`
    ),

    // Top districts by crime count
    query(
      `SELECT d.name AS district, COUNT(f.id) AS crime_count
       FROM districts d
       LEFT JOIN fir f ON f.district_id = d.id
         AND EXTRACT(YEAR FROM f.created_at) = EXTRACT(YEAR FROM NOW())
       GROUP BY d.name
       ORDER BY crime_count DESC
       LIMIT 10`
    ),

    // Crime by category (current year)
    query(
      `SELECT crime_category, COUNT(*) AS count
       FROM fir
       WHERE EXTRACT(YEAR FROM incident_date) = EXTRACT(YEAR FROM NOW())
       GROUP BY crime_category
       ORDER BY count DESC`
    ),

    // Monthly trend (last 12 months)
    query(
      `SELECT TO_CHAR(DATE_TRUNC('month', incident_date), 'Mon YYYY') AS month,
              DATE_TRUNC('month', incident_date) AS month_date,
              COUNT(*) AS total,
              COUNT(CASE WHEN status = 'filed' THEN 1 END) AS pending,
              COUNT(CASE WHEN status IN ('chargesheeted', 'closed') THEN 1 END) AS resolved
       FROM fir
       WHERE incident_date >= NOW() - INTERVAL '12 months'
       GROUP BY DATE_TRUNC('month', incident_date)
       ORDER BY month_date ASC`
    ),
  ])

  res.json({
    success: true,
    data: {
      stats: stats.rows[0] || {},
      recentCases: recentCases.rows,
      topDistricts: topDistricts.rows,
      crimeByCategory: crimeByCategory.rows,
      monthlyTrend: monthlyTrend.rows,
    },
  })
})

// ─── GET /analytics/crime-trends ─────────────────────────────────────────────
router.get('/crime-trends', requirePermission('analytics:read'), validate(AnalyticsQuerySchema, 'query'), async (req, res) => {
  const { districtId, year = new Date().getFullYear(), period } = req.query as { districtId?: string; year?: number; period?: string }

  const conditions: string[] = [`EXTRACT(YEAR FROM f.incident_date) = ${year}`]
  const params: unknown[] = []

  if (districtId) {
    conditions.push(`f.district_id = $1`)
    params.push(districtId)
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`

  const truncUnit = period === 'weekly' ? 'week' : period === 'quarterly' ? 'quarter' : 'month'

  const result = await query(
    `SELECT
       DATE_TRUNC('${truncUnit}', f.incident_date) AS period_start,
       f.crime_category,
       d.name AS district_name,
       COUNT(*) AS count
     FROM fir f
     JOIN districts d ON d.id = f.district_id
     ${whereClause}
     GROUP BY DATE_TRUNC('${truncUnit}', f.incident_date), f.crime_category, d.name
     ORDER BY period_start ASC`,
    params
  )

  res.json({ success: true, data: result.rows })
})

// ─── GET /analytics/district-comparison ──────────────────────────────────────
router.get('/district-comparison', requirePermission('analytics:read'), async (req, res) => {
  const result = await query(
    `SELECT
       d.name AS district,
       COUNT(f.id) AS total_fir,
       COUNT(CASE WHEN f.status = 'filed' THEN 1 END) AS pending,
       COUNT(CASE WHEN f.status IN ('chargesheeted') THEN 1 END) AS chargesheeted,
       COUNT(CASE WHEN f.status = 'closed' THEN 1 END) AS closed,
       COUNT(c.id) AS total_cases,
       COUNT(CASE WHEN c.status NOT IN ('closed','archived') THEN 1 END) AS open_cases
     FROM districts d
     LEFT JOIN fir f ON f.district_id = d.id AND EXTRACT(YEAR FROM f.created_at) = EXTRACT(YEAR FROM NOW())
     LEFT JOIN cases c ON c.district_id = d.id AND EXTRACT(YEAR FROM c.created_at) = EXTRACT(YEAR FROM NOW())
     GROUP BY d.name
     ORDER BY total_fir DESC`
  )

  res.json({ success: true, data: result.rows })
})

// ─── GET /analytics/heatmap ───────────────────────────────────────────────────
router.get('/heatmap', requirePermission('analytics:read'), async (req, res) => {
  const result = await query(
    `SELECT
       d.name AS district,
       f.crime_category,
       COUNT(*) AS count,
       d.latitude, d.longitude
     FROM fir f
     JOIN districts d ON d.id = f.district_id
     WHERE f.incident_date >= NOW() - INTERVAL '6 months'
     GROUP BY d.name, f.crime_category, d.latitude, d.longitude
     ORDER BY count DESC`
  )

  res.json({ success: true, data: result.rows })
})

// ─── GET /analytics/criminal-stats ───────────────────────────────────────────
router.get('/criminal-stats', requirePermission('analytics:read'), async (req, res) => {
  const [riskDist, ageGroup, wantedByDistrict] = await Promise.all([
    query(`SELECT risk_level, COUNT(*) AS count FROM criminals GROUP BY risk_level ORDER BY count DESC`),
    query(`
      SELECT
        CASE
          WHEN age < 20 THEN 'Under 20'
          WHEN age BETWEEN 20 AND 30 THEN '20-30'
          WHEN age BETWEEN 31 AND 40 THEN '31-40'
          WHEN age BETWEEN 41 AND 50 THEN '41-50'
          ELSE 'Above 50'
        END AS age_group,
        COUNT(*) AS count
      FROM criminals WHERE age IS NOT NULL
      GROUP BY age_group ORDER BY count DESC
    `),
    query(`
      SELECT d.name AS district, COUNT(cr.id) AS wanted_count
      FROM criminals cr
      JOIN districts d ON d.id = cr.district_id
      WHERE cr.is_wanted = TRUE
      GROUP BY d.name ORDER BY wanted_count DESC LIMIT 10
    `),
  ])

  res.json({
    success: true,
    data: {
      riskDistribution: riskDist.rows,
      ageGroups: ageGroup.rows,
      wantedByDistrict: wantedByDistrict.rows,
    },
  })
})

// ─── GET /analytics/prediction ────────────────────────────────────────────────
router.get('/prediction', requirePermission('analytics:read'), async (req, res) => {
  // Simple moving average based prediction for next 3 months
  const result = await query(
    `WITH monthly_counts AS (
       SELECT
         DATE_TRUNC('month', incident_date) AS month,
         COUNT(*) AS count
       FROM fir
       WHERE incident_date >= NOW() - INTERVAL '12 months'
       GROUP BY DATE_TRUNC('month', incident_date)
       ORDER BY month
     ),
     moving_avg AS (
       SELECT
         month,
         count,
         AVG(count) OVER (ORDER BY month ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS moving_avg_3
       FROM monthly_counts
     )
     SELECT * FROM moving_avg ORDER BY month ASC`
  )

  res.json({ success: true, data: result.rows })
})

export default router
