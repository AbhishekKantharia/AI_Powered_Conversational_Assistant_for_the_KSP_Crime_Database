import { Request, Response, NextFunction } from 'express';
/**
 * Check if a role has permission for an action
 */
export declare function hasPermission(role: string, permission: string): boolean;
/**
 * Middleware: require specific permission
 */
export declare function requirePermission(permission: string): (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Middleware: require minimum role level
 */
export declare function requireRole(...roles: string[]): (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Middleware: require administrator role
 */
export declare const requireAdmin: (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Middleware: check if user owns a resource or is admin
 */
export declare function requireOwnerOrAdmin(getOwnerId: (req: Request) => string | undefined): (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=rbac.middleware.d.ts.map