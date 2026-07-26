import { Request, Response, NextFunction } from 'express'
import { z, ZodSchema } from 'zod'
import { AppError } from './error.middleware'

export function validate(schema: ZodSchema, target: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target])
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
      return next(
        new AppError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`,
          422,
          'VALIDATION_ERROR'
        )
      )
    }
    req[target] = result.data
    next()
  }
}

// Common validation schemas
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc', 'ASC', 'DESC']).default('desc'),
  search: z.string().optional(),
})

export const UUIDSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
})

export const DateRangeSchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
})
