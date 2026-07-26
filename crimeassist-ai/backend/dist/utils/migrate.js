"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const fs_1 = require("fs");
const path_1 = require("path");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pool = new pg_1.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'crimeassist_db',
    user: process.env.DB_USER || 'crimeassist',
    password: process.env.DB_PASSWORD || 'your_secure_password',
    max: 10,
});
async function migrate() {
    const client = await pool.connect();
    try {
        console.log('🔄 Running database migrations...');
        const schemaPath = (0, path_1.join)(__dirname, '../../../database/schema.sql');
        const schema = (0, fs_1.readFileSync)(schemaPath, 'utf-8');
        await client.query('BEGIN');
        try {
            await client.query(schema);
            await client.query('COMMIT');
            console.log('✅ Migrations completed successfully');
        }
        catch (err) {
            await client.query('ROLLBACK');
            console.error('❌ Migration failed, rolled back:', err);
            throw err;
        }
        console.log('📊 Verifying tables...');
        const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
        console.log('Tables created:');
        result.rows.forEach((row) => {
            console.log(`  - ${row.table_name}`);
        });
    }
    finally {
        client.release();
        await pool.end();
    }
}
migrate().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
//# sourceMappingURL=migrate.js.map