"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitStrict = exports.rateLimitAuth = exports.rateLimitAI = exports.rateLimitGeneral = void 0;
exports.setupRateLimiters = setupRateLimiters;
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const logger_1 = require("../utils/logger");
let rateLimiterGeneral;
let rateLimiterAI;
let rateLimiterAuth;
let rateLimiterStrict;
function setupRateLimiters() {
    const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000; // Convert to seconds
    const max = parseInt(process.env.RATE_LIMIT_MAX || '100');
    const aiMax = parseInt(process.env.AI_RATE_LIMIT_MAX || '20');
    rateLimiterGeneral = new rate_limiter_flexible_1.RateLimiterMemory({
        keyPrefix: 'general',
        points: max,
        duration: windowMs,
    });
    rateLimiterAI = new rate_limiter_flexible_1.RateLimiterMemory({
        keyPrefix: 'ai',
        points: aiMax,
        duration: 60, // 1 minute
    });
    rateLimiterAuth = new rate_limiter_flexible_1.RateLimiterMemory({
        keyPrefix: 'auth',
        points: 10,
        duration: 900, // 15 minutes
        blockDuration: 900, // Block for 15 min on breach
    });
    rateLimiterStrict = new rate_limiter_flexible_1.RateLimiterMemory({
        keyPrefix: 'strict',
        points: 5,
        duration: 900,
        blockDuration: 3600, // Block for 1 hour on breach
    });
    logger_1.logger.info('Rate limiters configured');
}
function handleRateLimitError(err, res, limiterRes) {
    if (err instanceof Error && err.name === 'Error') {
        const retryAfter = limiterRes ? Math.ceil(limiterRes.msBeforeNext / 1000) : 60;
        res.set('Retry-After', String(retryAfter));
        res.set('X-RateLimit-Limit', '100');
        res.set('X-RateLimit-Remaining', '0');
        res.set('X-RateLimit-Reset', new Date(Date.now() + (limiterRes?.msBeforeNext || 60000)).toISOString());
        res.status(429).json({
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: `Too many requests. Try again in ${retryAfter} seconds.`,
            },
        });
    }
}
const rateLimitGeneral = async (req, res, next) => {
    const key = req.user?.userId || req.ip || 'anonymous';
    try {
        const rateLimiterRes = await rateLimiterGeneral.consume(key);
        res.set('X-RateLimit-Remaining', String(rateLimiterRes.remainingPoints));
        next();
    }
    catch (err) {
        handleRateLimitError(err, res, err);
    }
};
exports.rateLimitGeneral = rateLimitGeneral;
const rateLimitAI = async (req, res, next) => {
    const key = `ai_${req.user?.userId || req.ip}`;
    try {
        await rateLimiterAI.consume(key);
        next();
    }
    catch (err) {
        handleRateLimitError(err, res, err);
    }
};
exports.rateLimitAI = rateLimitAI;
const rateLimitAuth = async (req, res, next) => {
    const key = `auth_${req.ip}`;
    try {
        await rateLimiterAuth.consume(key);
        next();
    }
    catch (err) {
        logger_1.logger.warn('Auth rate limit exceeded', { ip: req.ip });
        handleRateLimitError(err, res, err);
    }
};
exports.rateLimitAuth = rateLimitAuth;
const rateLimitStrict = async (req, res, next) => {
    const key = `strict_${req.ip}`;
    try {
        await rateLimiterStrict.consume(key);
        next();
    }
    catch (err) {
        logger_1.logger.warn('Strict rate limit exceeded', { ip: req.ip, path: req.path });
        handleRateLimitError(err, res, err);
    }
};
exports.rateLimitStrict = rateLimitStrict;
//# sourceMappingURL=rateLimit.middleware.js.map