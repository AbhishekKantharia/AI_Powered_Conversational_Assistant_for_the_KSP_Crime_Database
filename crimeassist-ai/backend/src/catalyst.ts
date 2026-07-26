import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import dotenv from 'dotenv'
import path from 'path'

import { logger } from './utils/logger'
import { connectDB } from './services/database.service'
import { errorHandler } from './middleware/error.middleware'
import { requestLogger } from './middleware/audit.middleware'
import { setupRoutes } from './routes'
import { initializeCache } from './services/cache.service'

dotenv.config()

const app = express()

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}))

app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}))

app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  }))
}

app.use(requestLogger)

setupRoutes(app)

app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    service: 'CrimeAssist AI Backend',
  })
})

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
  })
})

app.use(errorHandler)

let initialized = false

async function initApp() {
  if (initialized) return
  try {
    await connectDB()
    logger.info('Database connected successfully')
    await initializeCache()
    logger.info('Cache initialized')
    initialized = true
  } catch (error) {
    logger.error('Failed to initialize:', error)
  }
}

initApp()

module.exports = app
