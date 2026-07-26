"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const database_service_1 = require("../services/database.service");
const publicData_service_1 = require("../services/publicData.service");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, rateLimit_middleware_1.rateLimitGeneral);
const AnalyticsQuerySchema = zod_1.z.object({
    districtId: zod_1.z.string().uuid().optional(),
    year: zod_1.z.coerce.number().int().min(2000).max(2030).optional(),
    period: zod_1.z.enum(['weekly', 'monthly', 'quarterly', 'yearly']).default('monthly'),
});
// ─── GET /analytics/dashboard ─────────────────────────────────────────────────
router.get('/dashboard', (0, rbac_middleware_1.requirePermission)('analytics:read'), async (req, res) => {
    const [stats, recentCases, topDistricts, crimeByCategory, monthlyTrend, ncrbData] = await Promise.all([
        // Dashboard stats
        (0, database_service_1.query)(`SELECT * FROM v_dashboard_stats LIMIT 1`),
        // Recent cases (last 10)
        (0, database_service_1.query)(`SELECT c.id, c.case_number, c.title, c.crime_category, c.status,
              c.priority, c.case_registered_date, c.ai_risk_score,
              d.name AS district_name, u.full_name AS officer_name
       FROM cases c
       LEFT JOIN districts d ON d.id = c.district_id
       LEFT JOIN users u ON u.id = c.assigned_officer_id
       ORDER BY c.created_at DESC LIMIT 10`),
        // Top districts by crime count
        (0, database_service_1.query)(`SELECT d.name AS district, COUNT(f.id) AS crime_count
       FROM districts d
       LEFT JOIN fir f ON f.district_id = d.id
         AND EXTRACT(YEAR FROM f.created_at) = EXTRACT(YEAR FROM NOW())
       GROUP BY d.name
       ORDER BY crime_count DESC
       LIMIT 10`),
        // Crime by category (current year)
        (0, database_service_1.query)(`SELECT crime_category, COUNT(*) AS count
       FROM fir
       WHERE EXTRACT(YEAR FROM incident_date) = EXTRACT(YEAR FROM NOW())
       GROUP BY crime_category
       ORDER BY count DESC`),
        // Monthly trend (last 12 months)
        (0, database_service_1.query)(`SELECT TO_CHAR(DATE_TRUNC('month', incident_date), 'Mon YYYY') AS month,
              DATE_TRUNC('month', incident_date) AS month_date,
              COUNT(*) AS total,
              COUNT(CASE WHEN status = 'filed' THEN 1 END) AS pending,
              COUNT(CASE WHEN status IN ('chargesheeted', 'closed') THEN 1 END) AS resolved
       FROM fir
       WHERE incident_date >= NOW() - INTERVAL '12 months'
       GROUP BY DATE_TRUNC('month', incident_date)
       ORDER BY month_date ASC`),
        // NCRB public data for Karnataka (background enrichment)
        (0, publicData_service_1.fetchKarnatakaCrimeStats)().catch(() => []),
    ]);
    // Merge NCRB reference data into topDistricts if database has sparse data
    const dbDistricts = topDistricts.rows;
    let enrichedTopDistricts = dbDistricts;
    if (Array.isArray(ncrbData) && ncrbData.length > 0 && dbDistricts.length < 5) {
        const ncrbDistricts = ncrbData
            .sort((a, b) => b.totalCrime - a.totalCrime)
            .slice(0, 10)
            .map((d) => ({ district: d.district, crime_count: d.totalCrime, source: 'NCRB' }));
        enrichedTopDistricts = [...dbDistricts, ...ncrbDistricts].slice(0, 10);
    }
    res.json({
        success: true,
        data: {
            stats: stats.rows[0] || {},
            recentCases: recentCases.rows,
            topDistricts: enrichedTopDistricts,
            crimeByCategory: crimeByCategory.rows,
            monthlyTrend: monthlyTrend.rows,
            ncrbSummary: Array.isArray(ncrbData) && ncrbData.length > 0 ? {
                totalCrime: ncrbData.reduce((sum, d) => sum + d.totalCrime, 0),
                districts: ncrbData.length,
                source: 'NCRB Crime in India',
            } : null,
        },
    });
});
// ─── GET /analytics/crime-trends ─────────────────────────────────────────────
router.get('/crime-trends', (0, rbac_middleware_1.requirePermission)('analytics:read'), (0, validation_middleware_1.validate)(AnalyticsQuerySchema, 'query'), async (req, res) => {
    const { districtId, year = new Date().getFullYear(), period } = req.query;
    const allowedTruncUnits = { weekly: 'week', monthly: 'month', quarterly: 'quarter', yearly: 'year' };
    const truncUnit = allowedTruncUnits[period || 'monthly'] || 'month';
    const conditions = [`EXTRACT(YEAR FROM f.incident_date) = $1`];
    const params = [year];
    let idx = 2;
    if (districtId) {
        conditions.push(`f.district_id = $${idx++}`);
        params.push(districtId);
    }
    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const result = await (0, database_service_1.query)(`SELECT
       DATE_TRUNC($${idx}, f.incident_date) AS period_start,
       f.crime_category,
       d.name AS district_name,
       COUNT(*) AS count
     FROM fir f
     JOIN districts d ON d.id = f.district_id
     ${whereClause}
     GROUP BY DATE_TRUNC($${idx}, f.incident_date), f.crime_category, d.name
     ORDER BY period_start ASC`, [...params, truncUnit]);
    res.json({ success: true, data: result.rows });
});
// ─── GET /analytics/district-comparison ──────────────────────────────────────
router.get('/district-comparison', (0, rbac_middleware_1.requirePermission)('analytics:read'), async (req, res) => {
    const result = await (0, database_service_1.query)(`SELECT
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
     ORDER BY total_fir DESC`);
    res.json({ success: true, data: result.rows });
});
// ─── GET /analytics/heatmap ───────────────────────────────────────────────────
router.get('/heatmap', (0, rbac_middleware_1.requirePermission)('analytics:read'), async (req, res) => {
    const result = await (0, database_service_1.query)(`SELECT
       d.name AS district,
       f.crime_category,
       COUNT(*) AS count,
       d.latitude, d.longitude
     FROM fir f
     JOIN districts d ON d.id = f.district_id
     WHERE f.incident_date >= NOW() - INTERVAL '6 months'
     GROUP BY d.name, f.crime_category, d.latitude, d.longitude
     ORDER BY count DESC`);
    res.json({ success: true, data: result.rows });
});
// ─── GET /analytics/criminal-stats ───────────────────────────────────────────
router.get('/criminal-stats', (0, rbac_middleware_1.requirePermission)('analytics:read'), async (req, res) => {
    const [riskDist, ageGroup, wantedByDistrict] = await Promise.all([
        (0, database_service_1.query)(`SELECT risk_level, COUNT(*) AS count FROM criminals GROUP BY risk_level ORDER BY count DESC`),
        (0, database_service_1.query)(`
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
        (0, database_service_1.query)(`
      SELECT d.name AS district, COUNT(cr.id) AS wanted_count
      FROM criminals cr
      JOIN districts d ON d.id = cr.district_id
      WHERE cr.is_wanted = TRUE
      GROUP BY d.name ORDER BY wanted_count DESC LIMIT 10
    `),
    ]);
    res.json({
        success: true,
        data: {
            riskDistribution: riskDist.rows,
            ageGroups: ageGroup.rows,
            wantedByDistrict: wantedByDistrict.rows,
        },
    });
});
// ─── GET /analytics/prediction ────────────────────────────────────────────────
router.get('/prediction', (0, rbac_middleware_1.requirePermission)('analytics:read'), async (req, res) => {
    // Simple moving average based prediction for next 3 months
    const result = await (0, database_service_1.query)(`WITH monthly_counts AS (
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
     SELECT * FROM moving_avg ORDER BY month ASC`);
    res.json({ success: true, data: result.rows });
});
exports.default = router;
//# sourceMappingURL=analytics.routes.js.map