import { Pool } from 'pg'
import { readFileSync } from 'fs'
import { join } from 'path'
import dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'crimeassist_db',
  user: process.env.DB_USER || 'crimeassist',
  password: process.env.DB_PASSWORD || 'your_secure_password',
  max: 10,
})

async function migrate() {
  const client = await pool.connect()
  try {
    console.log('🔄 Running database migrations...')

    const schemaPath = join(__dirname, '../../../database/schema.sql')
    const schema = readFileSync(schemaPath, 'utf-8')

    await client.query('BEGIN')

    try {
      await client.query(schema)
      await client.query('COMMIT')
      console.log('✅ Migrations completed successfully')
    } catch (err) {
      await client.query('ROLLBACK')
      console.error('❌ Migration failed, rolled back:', err)
      throw err
    }

    console.log('📊 Verifying tables...')
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)

    console.log('Tables created:')
    result.rows.forEach((row) => {
      console.log(`  - ${(row as { table_name: string }).table_name}`)
    })
  } finally {
    client.release()
    await pool.end()
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
