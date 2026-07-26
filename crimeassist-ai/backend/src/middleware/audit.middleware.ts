import { Request, Response, NextFunction } from 'express'
import { query } from '../services/database.service'
import { logger } from '../utils/logger'

// Log every incoming request
export const requestLogger = (req: Request, _res: Response, next: NextFunction): void => {
  req.startTime = Date.now()
  next()
}

// Extend Request type
declare global {
  namespace Express {
    interface Request {
      startTime?: number
    }
  }
}

// Database audit log writer
export async function writeAuditLog(params: {
  userId?: string
  action: string
  resourceType: string
  resourceId?: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  status?: 'success' | 'failure' | 'warning'
  errorMessage?: string
  durationMs?: number
}): Promise<void> {
  try {
    await query(
      `INSERT INTO audit_logs
       (user_id, action, resource_type, resource_id, old_values, new_values,
        ip_address, user_agent, status, error_message, duration_ms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        params.userId || null,
        params.action,
        params.resourceType,
        params.resourceId || null,
        params.oldValues ? JSON.stringify(params.oldValues) : null,
        params.newValues ? JSON.stringify(params.newValues) : null,
        params.ipAddress || null,
        params.userAgent || null,
        params.status || 'success',
        params.errorMessage || null,
        params.durationMs || null,
      ]
    )
  } catch (err) {
    // Non-critical: log failure but don't throw
    logger.error('Failed to write audit log:', err)
  }
}

// Middleware: auto-audit for mutating operations
export const auditMiddleware = (action: string, resourceType: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const originalJson = res.json.bind(res)

    res.json = (body: unknown) => {
      const duration = req.startTime ? Date.now() - req.startTime : 0
      const status = res.statusCode < 400 ? 'success' : 'failure'

      writeAuditLog({
        userId: req.user?.userId,
        action,
        resourceType,
        resourceId: req.params?.id,
        newValues: req.body,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status,
        durationMs: duration,
      })

      return originalJson(body)
    }

    next()
  }
}
