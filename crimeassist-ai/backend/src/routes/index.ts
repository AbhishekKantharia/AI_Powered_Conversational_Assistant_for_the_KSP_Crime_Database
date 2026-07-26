import { Application } from 'express'
import { setupRateLimiters } from '../middleware/rateLimit.middleware'

import authRouter from './auth.routes'
import casesRouter from './cases.routes'
import firRouter from './fir.routes'
import criminalsRouter from './criminals.routes'
import analyticsRouter from './analytics.routes'
import aiRouter from './ai.routes'
import reportsRouter from './reports.routes'
import usersRouter from './users.routes'
import settingsRouter from './settings.routes'
import evidenceRouter from './evidence.routes'
import publicDataRouter from './public-data.routes'

export function setupRoutes(app: Application): void {
  setupRateLimiters()

  const API_PREFIX = '/api/v1'

  app.use(`${API_PREFIX}/auth`, authRouter)
  app.use(`${API_PREFIX}/cases`, casesRouter)
  app.use(`${API_PREFIX}/fir`, firRouter)
  app.use(`${API_PREFIX}/criminals`, criminalsRouter)
  app.use(`${API_PREFIX}/analytics`, analyticsRouter)
  app.use(`${API_PREFIX}/ai`, aiRouter)
  app.use(`${API_PREFIX}/reports`, reportsRouter)
  app.use(`${API_PREFIX}/users`, usersRouter)
  app.use(`${API_PREFIX}/settings`, settingsRouter)
  app.use(`${API_PREFIX}/evidence`, evidenceRouter)
  app.use(`${API_PREFIX}/public-data`, publicDataRouter)

  // Also support /api prefix (no version)
  app.use('/api/auth', authRouter)
  app.use('/api/cases', casesRouter)
  app.use('/api/fir', firRouter)
  app.use('/api/criminals', criminalsRouter)
  app.use('/api/analytics', analyticsRouter)
  app.use('/api/ai', aiRouter)
  app.use('/api/reports', reportsRouter)
  app.use('/api/users', usersRouter)
  app.use('/api/settings', settingsRouter)
  app.use('/api/evidence', evidenceRouter)
  app.use('/api/public-data', publicDataRouter)

  // Also support root-level routes (for Catalyst Advanced I/O which strips function prefix)
  app.use('/auth', authRouter)
  app.use('/cases', casesRouter)
  app.use('/fir', firRouter)
  app.use('/criminals', criminalsRouter)
  app.use('/analytics', analyticsRouter)
  app.use('/ai', aiRouter)
  app.use('/reports', reportsRouter)
  app.use('/users', usersRouter)
  app.use('/settings', settingsRouter)
  app.use('/evidence', evidenceRouter)
  app.use('/public-data', publicDataRouter)
}
