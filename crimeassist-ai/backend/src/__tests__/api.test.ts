import express from 'express'
import request from 'supertest'

// Mock database service
jest.mock('../services/database.service', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
  query: jest.fn().mockResolvedValue({ rows: [{ status: 'healthy' }], rowCount: 1 }),
}))

// Mock cache service
jest.mock('../services/cache.service', () => ({
  initializeCache: jest.fn().mockResolvedValue(undefined),
}))

// Mock socket utils
jest.mock('../utils/socket', () => ({
  setupSocketHandlers: jest.fn(),
}))

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    http: jest.fn(),
  },
}))

describe('Health Check', () => {
  let app: express.Express

  beforeAll(() => {
    app = express()
    app.get('/health', (_req, res) => {
      res.json({
        status: 'healthy',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        service: 'CrimeAssist AI Backend',
      })
    })
  })

  it('should return 200 with health status', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('healthy')
    expect(res.body.version).toBe('1.0.0')
    expect(res.body.service).toBe('CrimeAssist AI Backend')
  })

  it('should return timestamp', async () => {
    const res = await request(app).get('/health')
    expect(res.body.timestamp).toBeDefined()
    const timestamp = new Date(res.body.timestamp)
    expect(timestamp.getTime()).not.toBeNaN()
  })
})

describe('404 Handler', () => {
  let app: express.Express

  beforeAll(() => {
    app = express()
    app.use((_req, res) => {
      res.status(404).json({
        success: false,
        error: 'Route not found',
        path: '/nonexistent',
      })
    })
  })

  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/nonexistent')
    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })
})

describe('Validation Middleware Schemas', () => {
  it('should validate pagination params', async () => {
    const { PaginationSchema } = await import('../middleware/validation.middleware')

    // Valid
    expect(PaginationSchema.safeParse({ page: 1, limit: 10 }).success).toBe(true)
    expect(PaginationSchema.safeParse({}).success).toBe(true)

    // Invalid
    expect(PaginationSchema.safeParse({ page: -1 }).success).toBe(false)
    expect(PaginationSchema.safeParse({ limit: 1000 }).success).toBe(false)
  })

  it('should validate UUID format', async () => {
    const { UUIDSchema } = await import('../middleware/validation.middleware')

    const validUUID = '550e8400-e29b-41d4-a716-446655440000'
    expect(UUIDSchema.safeParse({ id: validUUID }).success).toBe(true)
    expect(UUIDSchema.safeParse({ id: 'invalid' }).success).toBe(false)
  })
})
