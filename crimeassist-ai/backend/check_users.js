const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_adBUIRGf1vs2@ep-dark-term-azppfafv-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    const r = await pool.query('SELECT COUNT(*) FROM users');
    console.log('Users count:', r.rows[0].count);
    const users = await pool.query('SELECT username, role, status FROM users LIMIT 5');
    console.log('Users:', users.rows);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
})();
