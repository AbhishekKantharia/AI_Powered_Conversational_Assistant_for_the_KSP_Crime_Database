const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

(async () => {
  const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_adBUIRGf1vs2@ep-dark-term-azppfafv-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
  });

  try {
    const hash = await bcrypt.hash('password', 10);
    console.log('Generated hash:', hash);
    
    const result = await pool.query('UPDATE users SET password_hash = $1', [hash]);
    console.log('Updated', result.rowCount, 'users');
    
    const verify = await pool.query('SELECT username, password_hash FROM users');
    for (const u of verify.rows) {
      const match = await bcrypt.compare('password', u.password_hash);
      console.log(u.username, '- verify:', match);
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
})();
