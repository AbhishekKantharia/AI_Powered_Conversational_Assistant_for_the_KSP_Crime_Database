const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = 'postgresql://neondb_owner:npg_adBUIRGf1vs2@ep-dark-term-azppfafv.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

async function runMigration() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  try {
    // Run schema
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'database', 'schema.sql'), 'utf8');
    console.log('Running schema...');
    
    try {
      await client.query(schemaSQL);
      console.log('Schema created successfully!');
    } catch (err) {
      if (err.message.includes('vector') || err.message.includes('ivfflat')) {
        console.log('pgvector not available, retrying without vector columns...');
        const schemaNoVector = schemaSQL
          .replace(/CREATE EXTENSION IF NOT EXISTS "vector".*?;/gm, '')
          .replace(/vector\(1536\)/g, 'TEXT')
          .replace(/USING ivfflat \(embedding vector_cosine_ops\).*?;/gm, ';');
        await client.query(schemaNoVector);
        console.log('Schema created (without pgvector)!');
      } else {
        throw err;
      }
    }

    // Run seed
    const seedSQL = fs.readFileSync(path.join(__dirname, 'database', 'seeds', 'seed.sql'), 'utf8');
    console.log('Running seeds...');
    try {
      await client.query(seedSQL);
      console.log('Seeds inserted successfully!');
    } catch (err) {
      if (err.message.includes('duplicate') || err.message.includes('unique') || err.message.includes('already exists')) {
        console.log('Seeds already exist, skipping...');
      } else {
        console.error('Seed error:', err.message);
        throw err;
      }
    }

    // Verify
    const res = await client.query('SELECT COUNT(*) FROM districts');
    console.log(`Districts: ${res.rows[0].count}`);
    const res2 = await client.query('SELECT COUNT(*) FROM police_stations');
    console.log(`Police stations: ${res2.rows[0].count}`);
    const res3 = await client.query('SELECT COUNT(*) FROM users');
    console.log(`Users: ${res3.rows[0].count}`);

    console.log('Migration complete!');
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
