"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthenticate = exports.authenticate = void 0;
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
exports.verifyRefreshToken = verifyRefreshToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_service_1 = require("../services/database.service");
const error_middleware_1 = require("./error.middleware");
const authenticate = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new error_middleware_1.AppError('Access token required', 401, 'UNAUTHORIZED');
        }
        const token = authHeader.substring(7);
        const secret = process.env.JWT_ACCESS_SECRET;
        if (!secret)
            throw new Error('JWT secret not configured');
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, secret);
        }
        catch (err) {
            if (err instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new error_middleware_1.AppError('Access token expired', 401, 'TOKEN_EXPIRED');
            }
            throw new error_middleware_1.AppError('Invalid access token', 401, 'INVALID_TOKEN');
        }
        // Verify user still exists and is active
        const result = await (0, database_service_1.query)('SELECT id, role, status, badge_number FROM users WHERE id = $1', [decoded.userId]);
        if (result.rowCount === 0) {
            throw new error_middleware_1.AppError('User not found', 401, 'USER_NOT_FOUND');
        }
        const user = result.rows[0];
        if (user.status !== 'active') {
            throw new error_middleware_1.AppError('Account is not active', 403, 'ACCOUNT_INACTIVE');
        }
        req.user = { ...decoded, role: user.role };
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.authenticate = authenticate;
// Optional auth — doesn't throw if no token
const optionalAuthenticate = async (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }
    try {
        const token = authHeader.substring(7);
        const secret = process.env.JWT_ACCESS_SECRET;
        req.user = jsonwebtoken_1.default.verify(token, secret);
    }
    catch {
        // Silently ignore invalid tokens for optional auth
    }
    next();
};
exports.optionalAuthenticate = optionalAuthenticate;
function generateAccessToken(payload) {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret)
        throw new Error('JWT_ACCESS_SECRET not configured');
    return jsonwebtoken_1.default.sign(payload, secret, {
        expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
    });
}
function generateRefreshToken(userId) {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret)
        throw new Error('JWT_REFRESH_SECRET not configured');
    return jsonwebtoken_1.default.sign({ userId }, secret, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
    });
}
function verifyRefreshToken(token) {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret)
        throw new Error('JWT_REFRESH_SECRET not configured');
    return jsonwebtoken_1.default.verify(token, secret);
}
//# sourceMappingURL=auth.middleware.js.map