const catalyst = require('zcatalyst-sdk-node')
const { Pool } = require('pg')

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'crimeassist_db',
  user: process.env.DB_USER || 'crimeassist',
  password: process.env.DB_PASSWORD || 'your_secure_password',
})

module.exports = async function cronHandler(cronDetails, context) {
  const client = await pool.connect()
  try {
    const snapshotType = cronDetails?.payload?.snapshot_type || 'monthly_analytics'

    if (snapshotType === 'monthly_analytics') {
      const stats = await client.query(`
        SELECT
          COUNT(*) AS total_fir,
          COUNT(CASE WHEN status = 'filed' THEN 1 END) AS pending_fir,
          COUNT(CASE WHEN status IN ('chargesheeted', 'closed') THEN 1 END) AS resolved_fir,
          COUNT(CASE WHEN status IN ('under_investigation') THEN 1 END) AS active_investigations
        FROM fir
        WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())
          AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
      `)

      const caseStats = await client.query(`
        SELECT
          COUNT(*) AS total_cases,
          COUNT(CASE WHEN status NOT IN ('closed', 'archived') THEN 1 END) AS open_cases,
          COUNT(CASE WHEN status IN ('closed') THEN 1 END) AS closed_cases
        FROM cases
        WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())
          AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
      `)

      const period = new Date().toISOString().slice(0, 7)
      const snapshotData = {
        fir: stats.rows[0],
        cases: caseStats.rows[0],
        generatedAt: new Date().toISOString(),
      }

      await client.query(
        `INSERT INTO analytics_snapshots (snapshot_type, period, data)
         VALUES ($1, $2, $3)
         ON CONFLICT (snapshot_type, period)
         DO UPDATE SET data = $3, updated_at = NOW()`,
        [snapshotType, period, JSON.stringify(snapshotData)]
      )
    }

    if (snapshotType === 'risk_recalculation') {
      await client.query(`
        UPDATE criminals SET risk_score = LEAST(100, GREATEST(0,
          (total_cases * 5) +
          (CASE WHEN is_wanted THEN 30 ELSE 0 END) +
          (CASE WHEN is_absconding THEN 20 ELSE 0 END) +
          (CASE WHEN risk_level = 'critical' THEN 25 WHEN risk_level = 'high' THEN 15 WHEN risk_level = 'medium' THEN 5 ELSE 0 END)
        ))
        WHERE total_cases > 0 OR is_wanted = TRUE OR is_absconding = TRUE
      `)
    }

    console.log(`[CRON] ${snapshotType} completed at ${new Date().toISOString()}`)
    context.closeWithSuccess()
  } catch (error) {
    console.error('[CRON] Error:', error)
    context.closeWithFailure()
  } finally {
    client.release()
    await pool.end()
  }
}
