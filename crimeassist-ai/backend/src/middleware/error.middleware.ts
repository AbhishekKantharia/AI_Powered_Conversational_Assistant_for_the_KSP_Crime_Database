import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly isOperational: boolean

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational = true
  ) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = isOperational
    Error.captureStackTrace(this, this.constructor)
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  let statusCode = 500
  let code = 'INTERNAL_ERROR'
  let message = 'An unexpected error occurred'

  if (err instanceof AppError) {
    statusCode = err.statusCode
    code = err.code
    message = err.message
  } else if (err.name === 'ValidationError') {
    statusCode = 422
    code = 'VALIDATION_ERROR'
    message = err.message
  } else if ((err as NodeJS.ErrnoException).code === 'ECONNREFUSED') {
    statusCode = 503
    code = 'SERVICE_UNAVAILABLE'
    message = 'Database connection failed'
  }

  // Log error
  if (statusCode >= 500) {
    logger.error('Server error:', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      userId: req.user?.userId,
    })
  } else {
    logger.warn('Client error:', {
      message,
      code,
      path: req.path,
      method: req.method,
    })
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
    timestamp: new Date().toISOString(),
    path: req.path,
  })
}
