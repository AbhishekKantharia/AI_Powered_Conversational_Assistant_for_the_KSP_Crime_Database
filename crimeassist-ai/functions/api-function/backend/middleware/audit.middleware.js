"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditMiddleware = exports.requestLogger = void 0;
exports.writeAuditLog = writeAuditLog;
const database_service_1 = require("../services/database.service");
const logger_1 = require("../utils/logger");
// Log every incoming request
const requestLogger = (req, _res, next) => {
    req.startTime = Date.now();
    next();
};
exports.requestLogger = requestLogger;
// Database audit log writer
async function writeAuditLog(params) {
    try {
        await (0, database_service_1.query)(`INSERT INTO audit_logs
       (user_id, action, resource_type, resource_id, old_values, new_values,
        ip_address, user_agent, status, error_message, duration_ms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`, [
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
        ]);
    }
    catch (err) {
        // Non-critical: log failure but don't throw
        logger_1.logger.error('Failed to write audit log:', err);
    }
}
// Middleware: auto-audit for mutating operations
const auditMiddleware = (action, resourceType) => {
    return async (req, res, next) => {
        const originalJson = res.json.bind(res);
        res.json = (body) => {
            const duration = req.startTime ? Date.now() - req.startTime : 0;
            const status = res.statusCode < 400 ? 'success' : 'failure';
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
            });
            return originalJson(body);
        };
        next();
    };
};
exports.auditMiddleware = auditMiddleware;
//# sourceMappingURL=audit.middleware.js.map