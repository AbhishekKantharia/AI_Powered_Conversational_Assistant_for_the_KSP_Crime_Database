"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPool = getPool;
exports.connectDB = connectDB;
exports.disconnectDB = disconnectDB;
exports.query = query;
exports.withTransaction = withTransaction;
exports.buildPagination = buildPagination;
exports.buildPaginatedResponse = buildPaginatedResponse;
exports.vectorSearch = vectorSearch;
exports.globalVectorSearch = globalVectorSearch;
const pg_1 = require("pg");
const logger_1 = require("../utils/logger");
let pool = null;
function getPool() {
    if (!pool) {
        throw new Error('Database not connected. Call connectDB() first.');
    }
    return pool;
}
async function connectDB() {
    pool = new pg_1.Pool({
        connectionString: process.env.DATABASE_URL,
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'crimeassist_db',
        user: process.env.DB_USER || 'crimeassist',
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        min: parseInt(process.env.DB_POOL_MIN || '2'),
        max: parseInt(process.env.DB_POOL_MAX || '20'),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        statement_timeout: 30000,
    });
    pool.on('error', (err) => {
        logger_1.logger.error('Unexpected pool error:', err);
    });
    pool.on('connect', () => {
        logger_1.logger.debug('New database connection established');
    });
    // Test the connection
    const client = await pool.connect();
    try {
        await client.query('SELECT NOW()');
        logger_1.logger.info(`Connected to PostgreSQL: ${process.env.DB_NAME}`);
    }
    finally {
        client.release();
    }
}
async function disconnectDB() {
    if (pool) {
        await pool.end();
        pool = null;
        logger_1.logger.info('Database pool closed');
    }
}
// ─── Query Helper ────────────────────────────────────────────────────────────
async function query(text, params) {
    const pool = getPool();
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        if (duration > 1000) {
            logger_1.logger.warn('Slow query detected', { text: text.substring(0, 100), duration });
        }
        return result;
    }
    catch (error) {
        logger_1.logger.error('Database query error:', { text: text.substring(0, 100), error });
        throw error;
    }
}
// ─── Transaction Helper ──────────────────────────────────────────────────────
async function withTransaction(callback) {
    const pool = getPool();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
}
function buildPagination(options) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;
    return { limit, offset, page };
}
function buildPaginatedResponse(data, total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    return {
        data,
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    };
}
// ─── Vector Search Helper ────────────────────────────────────────────────────
async function vectorSearch(embedding, sourceType, limit = 10, threshold = 0.7) {
    const vectorStr = `[${embedding.join(',')}]`;
    const result = await query(`SELECT id, source_id, chunk_text, metadata,
     1 - (embedding <=> $1::vector) AS similarity
     FROM document_embeddings
     WHERE source_type = $2
     AND 1 - (embedding <=> $1::vector) > $3
     ORDER BY embedding <=> $1::vector
     LIMIT $4`, [vectorStr, sourceType, threshold, limit]);
    return result.rows;
}
async function globalVectorSearch(embedding, limit = 10, threshold = 0.6) {
    const vectorStr = `[${embedding.join(',')}]`;
    const result = await query(`SELECT id, source_type, source_id, chunk_text, metadata,
     1 - (embedding <=> $1::vector) AS similarity
     FROM document_embeddings
     WHERE 1 - (embedding <=> $1::vector) > $2
     ORDER BY embedding <=> $1::vector
     LIMIT $3`, [vectorStr, threshold, limit]);
    return result.rows;
}
//# sourceMappingURL=database.service.js.map