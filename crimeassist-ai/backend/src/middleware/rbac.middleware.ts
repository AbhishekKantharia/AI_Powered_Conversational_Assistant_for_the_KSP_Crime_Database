import { Request, Response, NextFunction } from 'express'
import { AppError } from './error.middleware'

// Role hierarchy
const ROLE_HIERARCHY: Record<string, number> = {
  administrator: 4,
  investigation_officer: 3,
  police_officer: 2,
  crime_analyst: 1,
}

// Permission matrix — resource:action -> allowed roles
const PERMISSIONS: Record<string, string[]> = {
  // Cases
  'cases:read': ['administrator', 'police_officer', 'investigation_officer', 'crime_analyst'],
  'cases:create': ['administrator', 'police_officer', 'investigation_officer'],
  'cases:update': ['administrator', 'police_officer', 'investigation_officer'],
  'cases:delete': ['administrator'],
  'cases:assign': ['administrator', 'investigation_officer'],

  // FIR
  'fir:read': ['administrator', 'police_officer', 'investigation_officer', 'crime_analyst'],
  'fir:create': ['administrator', 'police_officer', 'investigation_officer'],
  'fir:update': ['administrator', 'police_officer', 'investigation_officer'],
  'fir:delete': ['administrator'],

  // Criminals
  'criminals:read': ['administrator', 'police_officer', 'investigation_officer', 'crime_analyst'],
  'criminals:create': ['administrator', 'police_officer', 'investigation_officer'],
  'criminals:update': ['administrator', 'investigation_officer'],
  'criminals:delete': ['administrator'],

  // Analytics
  'analytics:read': ['administrator', 'crime_analyst'],
  'analytics:export': ['administrator', 'crime_analyst', 'investigation_officer'],

  // Reports
  'reports:read': ['administrator', 'police_officer', 'investigation_officer', 'crime_analyst'],
  'reports:create': ['administrator', 'police_officer', 'investigation_officer', 'crime_analyst'],
  'reports:delete': ['administrator'],

  // Users
  'users:read': ['administrator'],
  'users:create': ['administrator'],
  'users:update': ['administrator'],
  'users:delete': ['administrator'],

  // Settings
  'settings:read': ['administrator', 'police_officer', 'investigation_officer', 'crime_analyst'],
  'settings:update': ['administrator'],
  'settings:security': ['administrator'],

  // AI
  'ai:chat': ['administrator', 'police_officer', 'investigation_officer', 'crime_analyst'],
  'ai:summarize': ['administrator', 'police_officer', 'investigation_officer', 'crime_analyst'],
  'ai:search': ['administrator', 'police_officer', 'investigation_officer', 'crime_analyst'],

  // Evidence
  'evidence:read': ['administrator', 'police_officer', 'investigation_officer', 'crime_analyst'],
  'evidence:create': ['administrator', 'police_officer', 'investigation_officer'],
  'evidence:update': ['administrator', 'investigation_officer'],
  'evidence:delete': ['administrator'],

  // Audit
  'audit:read': ['administrator'],
}

/**
 * Check if a role has permission for an action
 */
export function hasPermission(role: string, permission: string): boolean {
  const allowedRoles = PERMISSIONS[permission]
  if (!allowedRoles) return false
  return allowedRoles.includes(role)
}

/**
 * Middleware: require specific permission
 */
export function requirePermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'))
    }

    if (!hasPermission(req.user.role, permission)) {
      return next(
        new AppError(
          `Access denied. Required permission: ${permission}`,
          403,
          'FORBIDDEN'
        )
      )
    }

    next()
  }
}

/**
 * Middleware: require minimum role level
 */
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'))
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Required roles: ${roles.join(', ')}`,
          403,
          'FORBIDDEN'
        )
      )
    }

    next()
  }
}

/**
 * Middleware: require administrator role
 */
export const requireAdmin = requireRole('administrator')

/**
 * Middleware: check if user owns a resource or is admin
 */
export function requireOwnerOrAdmin(getOwnerId: (req: Request) => string | undefined) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'))
    }

    const isAdmin = req.user.role === 'administrator'
    const ownerId = getOwnerId(req)
    const isOwner = ownerId === req.user.userId

    if (!isAdmin && !isOwner) {
      return next(new AppError('Access denied', 403, 'FORBIDDEN'))
    }

    next()
  }
}
