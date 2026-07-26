"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = void 0;
exports.hasPermission = hasPermission;
exports.requirePermission = requirePermission;
exports.requireRole = requireRole;
exports.requireOwnerOrAdmin = requireOwnerOrAdmin;
const error_middleware_1 = require("./error.middleware");
// Role hierarchy
const ROLE_HIERARCHY = {
    administrator: 4,
    investigation_officer: 3,
    police_officer: 2,
    crime_analyst: 1,
};
// Permission matrix — resource:action -> allowed roles
const PERMISSIONS = {
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
};
/**
 * Check if a role has permission for an action
 */
function hasPermission(role, permission) {
    const allowedRoles = PERMISSIONS[permission];
    if (!allowedRoles)
        return false;
    return allowedRoles.includes(role);
}
/**
 * Middleware: require specific permission
 */
function requirePermission(permission) {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new error_middleware_1.AppError('Authentication required', 401, 'UNAUTHORIZED'));
        }
        if (!hasPermission(req.user.role, permission)) {
            return next(new error_middleware_1.AppError(`Access denied. Required permission: ${permission}`, 403, 'FORBIDDEN'));
        }
        next();
    };
}
/**
 * Middleware: require minimum role level
 */
function requireRole(...roles) {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new error_middleware_1.AppError('Authentication required', 401, 'UNAUTHORIZED'));
        }
        if (!roles.includes(req.user.role)) {
            return next(new error_middleware_1.AppError(`Access denied. Required roles: ${roles.join(', ')}`, 403, 'FORBIDDEN'));
        }
        next();
    };
}
/**
 * Middleware: require administrator role
 */
exports.requireAdmin = requireRole('administrator');
/**
 * Middleware: check if user owns a resource or is admin
 */
function requireOwnerOrAdmin(getOwnerId) {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new error_middleware_1.AppError('Authentication required', 401, 'UNAUTHORIZED'));
        }
        const isAdmin = req.user.role === 'administrator';
        const ownerId = getOwnerId(req);
        const isOwner = ownerId === req.user.userId;
        if (!isAdmin && !isOwner) {
            return next(new error_middleware_1.AppError('Access denied', 403, 'FORBIDDEN'));
        }
        next();
    };
}
//# sourceMappingURL=rbac.middleware.js.map