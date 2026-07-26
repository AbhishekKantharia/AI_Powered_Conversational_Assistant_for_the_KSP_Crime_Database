import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import { createServer } from 'http'
import { Server as SocketServer } from 'socket.io'
import dotenv from 'dotenv'
import path from 'path'

import { logger } from './utils/logger'
import { connectDB } from './services/database.service'
import { errorHandler } from './middleware/error.middleware'
import { requestLogger } from './middleware/audit.middleware'
import { setupRoutes } from './routes'
import { setupSocketHandlers } from './utils/socket'
import { initializeCache } from './services/cache.service'

dotenv.config()

const app = express()
const httpServer = createServer(app)

// ─── Socket.io Setup ────────────────────────────────────────────────────────
export const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

// ─── Security Middleware ─────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
}))

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.CORS_ORIGIN || 'http://localhost:3000',
      process.env.FRONTEND_URL || 'http://localhost:3000',
    ]
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Auth-Token', 'X-Request-ID'],
}))

// ─── General Middleware ───────────────────────────────────────────────────────
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// HTTP request logging (Morgan)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  }))
}

// Custom audit logging middleware
app.use(requestLogger)

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

// ─── API Routes ───────────────────────────────────────────────────────────────
setupRoutes(app)

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    service: 'CrimeAssist AI Backend',
  })
})

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
  })
})

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use(errorHandler)

// ─── Socket.io Handlers ──────────────────────────────────────────────────────
setupSocketHandlers(io)

// ─── Start Server ────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '5000', 10)

async function bootstrap() {
  try {
    // Connect to PostgreSQL
    await connectDB()
    logger.info('✅ Database connected successfully')

    // Initialize cache
    await initializeCache()
    logger.info('✅ Cache initialized')

    httpServer.listen(PORT, () => {
      logger.info(`🚀 CrimeAssist AI Backend running on port ${PORT}`)
      logger.info(`📍 Environment: ${process.env.NODE_ENV}`)
      logger.info(`🔗 API: http://localhost:${PORT}/api`)
      logger.info(`❤️  Health: http://localhost:${PORT}/health`)
    })
  } catch (error) {
    logger.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

bootstrap()

export default app
