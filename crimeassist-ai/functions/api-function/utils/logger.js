"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogger = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logDir = process.env.LOG_DIR || './logs';
// Create log directory if it doesn't exist
if (!fs_1.default.existsSync(logDir)) {
    fs_1.default.mkdirSync(logDir, { recursive: true });
}
const { combine, timestamp, printf, colorize, json, errors } = winston_1.default.format;
// Custom log format for console
const consoleFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `${timestamp} [${level}]: ${stack || message}${metaStr}`;
});
exports.logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), json()),
    defaultMeta: { service: 'crimeassist-api' },
    transports: [
        // Console output
        new winston_1.default.transports.Console({
            format: combine(colorize({ all: true }), timestamp({ format: 'HH:mm:ss' }), consoleFormat),
        }),
        // Error log file
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
        }),
        // Combined log file
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'combined.log'),
            maxsize: 20 * 1024 * 1024, // 20MB
            maxFiles: 10,
        }),
        // Audit log file
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'audit.log'),
            level: 'info',
            maxsize: 50 * 1024 * 1024,
            maxFiles: 30,
        }),
    ],
    exceptionHandlers: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'exceptions.log'),
        }),
    ],
    rejectionHandlers: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'rejections.log'),
        }),
    ],
});
// Add http level
exports.logger.add(new winston_1.default.transports.Console({
    format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), consoleFormat),
    level: 'http',
}));
exports.auditLogger = {
    log: (action, resource, data) => {
        exports.logger.info('AUDIT', { action, resource, ...data, timestamp: new Date().toISOString() });
    },
};
//# sourceMappingURL=logger.js.map