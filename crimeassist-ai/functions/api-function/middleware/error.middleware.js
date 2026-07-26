"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.errorHandler = errorHandler;
const logger_1 = require("../utils/logger");
class AppError extends Error {
    statusCode;
    code;
    isOperational;
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
function errorHandler(err, req, res, _next) {
    let statusCode = 500;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        code = err.code;
        message = err.message;
    }
    else if (err.name === 'ValidationError') {
        statusCode = 422;
        code = 'VALIDATION_ERROR';
        message = err.message;
    }
    else if (err.code === 'ECONNREFUSED') {
        statusCode = 503;
        code = 'SERVICE_UNAVAILABLE';
        message = 'Database connection failed';
    }
    // Log error
    if (statusCode >= 500) {
        logger_1.logger.error('Server error:', {
            message: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method,
            userId: req.user?.userId,
        });
    }
    else {
        logger_1.logger.warn('Client error:', {
            message,
            code,
            path: req.path,
            method: req.method,
        });
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
    });
}
//# sourceMappingURL=error.middleware.js.map