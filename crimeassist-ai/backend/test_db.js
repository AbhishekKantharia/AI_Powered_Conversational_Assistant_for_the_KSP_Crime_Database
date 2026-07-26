const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_adBUIRGf1vs2@ep-dark-term-azppfafv-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    const r = await pool.query('SELECT NOW()');
    console.log('Connected:', r.rows[0]);
    const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
    console.log('Tables:', tables.rows.map(t => t.table_name));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
})();
