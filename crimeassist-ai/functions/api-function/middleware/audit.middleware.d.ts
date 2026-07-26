import { Request, Response, NextFunction } from 'express';
export declare const requestLogger: (req: Request, _res: Response, next: NextFunction) => void;
declare global {
    namespace Express {
        interface Request {
            startTime?: number;
        }
    }
}
export declare function writeAuditLog(params: {
    userId?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    status?: 'success' | 'failure' | 'warning';
    errorMessage?: string;
    durationMs?: number;
}): Promise<void>;
export declare const auditMiddleware: (action: string, resourceType: string) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=audit.middleware.d.ts.map