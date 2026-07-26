const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://<user>:<password>@<host>/<database>?sslmode=require';

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
    
    // Split by semicolons but be careful with dollar-quoted strings
    // Execute the whole thing as one
    try {
      await client.query(schemaSQL);
      console.log('Schema created successfully!');
    } catch (err) {
      // If pgvector extension fails, try without it
      if (err.message.includes('vector')) {
        console.log('pgvector extension not available, creating schema without it...');
        const schemaNoVector = schemaSQL
          .replace(/CREATE EXTENSION IF NOT EXISTS "vector".*?;/g, '')
          .replace(/vector\(1536\)/g, 'TEXT')
          .replace(/USING ivfflat.*?;\s*/g, ';');
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
      if (err.message.includes('duplicate') || err.message.includes('unique')) {
        console.log('Seeds already exist, skipping...');
      } else {
        console.error('Seed error:', err.message);
      }
    }

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
