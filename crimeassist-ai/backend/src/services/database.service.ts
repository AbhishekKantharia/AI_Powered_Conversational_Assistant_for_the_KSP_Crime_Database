import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg'
import { logger } from '../utils/logger'

let pool: Pool | null = null

export function getPool(): Pool {
  if (!pool) {
    throw new Error('Database not connected. Call connectDB() first.')
  }
  return pool
}

export async function connectDB(): Promise<void> {
  pool = new Pool({
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
  })

  pool.on('error', (err) => {
    logger.error('Unexpected pool error:', err)
  })

  pool.on('connect', () => {
    logger.debug('New database connection established')
  })

  // Test the connection
  const client = await pool.connect()
  try {
    await client.query('SELECT NOW()')
    logger.info(`Connected to PostgreSQL: ${process.env.DB_NAME}`)
  } finally {
    client.release()
  }
}

export async function disconnectDB(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
    logger.info('Database pool closed')
  }
}

// ─── Query Helper ────────────────────────────────────────────────────────────
export async function query<T extends QueryResultRow = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const pool = getPool()
  const start = Date.now()
  try {
    const result = await pool.query<T>(text, params)
    const duration = Date.now() - start
    if (duration > 1000) {
      logger.warn('Slow query detected', { text: text.substring(0, 100), duration })
    }
    return result
  } catch (error) {
    logger.error('Database query error:', { text: text.substring(0, 100), error })
    throw error
  }
}

// ─── Transaction Helper ──────────────────────────────────────────────────────
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = getPool()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

// ─── Pagination Helper ───────────────────────────────────────────────────────
export interface PaginationOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export function buildPagination(options: PaginationOptions): {
  limit: number
  offset: number
  page: number
} {
  const page = Math.max(1, options.page || 1)
  const limit = Math.min(100, Math.max(1, options.limit || 20))
  const offset = (page - 1) * limit
  return { limit, offset, page }
}

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit)
  return {
    data,
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  }
}

// ─── Vector Search Helper ────────────────────────────────────────────────────
export async function vectorSearch(
  embedding: number[],
  sourceType: string,
  limit: number = 10,
  threshold: number = 0.7
): Promise<Array<{ id: string; source_id: string; chunk_text: string; similarity: number; metadata: Record<string, unknown> }>> {
  const vectorStr = `[${embedding.join(',')}]`
  const result = await query<{
    id: string
    source_id: string
    chunk_text: string
    similarity: number
    metadata: Record<string, unknown>
  }>(
    `SELECT id, source_id, chunk_text, metadata,
     1 - (embedding <=> $1::vector) AS similarity
     FROM document_embeddings
     WHERE source_type = $2
     AND 1 - (embedding <=> $1::vector) > $3
     ORDER BY embedding <=> $1::vector
     LIMIT $4`,
    [vectorStr, sourceType, threshold, limit]
  )
  return result.rows
}

export async function globalVectorSearch(
  embedding: number[],
  limit: number = 10,
  threshold: number = 0.6
): Promise<Array<{ id: string; source_type: string; source_id: string; chunk_text: string; similarity: number; metadata: Record<string, unknown> }>> {
  const vectorStr = `[${embedding.join(',')}]`
  const result = await query<{
    id: string
    source_type: string
    source_id: string
    chunk_text: string
    similarity: number
    metadata: Record<string, unknown>
  }>(
    `SELECT id, source_type, source_id, chunk_text, metadata,
     1 - (embedding <=> $1::vector) AS similarity
     FROM document_embeddings
     WHERE 1 - (embedding <=> $1::vector) > $2
     ORDER BY embedding <=> $1::vector
     LIMIT $3`,
    [vectorStr, threshold, limit]
  )
  return result.rows
}
