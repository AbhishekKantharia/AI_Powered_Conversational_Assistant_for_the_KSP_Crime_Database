"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_service_1 = require("../services/database.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const auth_middleware_2 = require("../middleware/auth.middleware");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const error_middleware_1 = require("../middleware/error.middleware");
const audit_middleware_1 = require("../middleware/audit.middleware");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// ─── Validation Schemas ──────────────────────────────────────────────────────
const LoginSchema = zod_1.z.object({
    username: zod_1.z.string().min(3).max(50),
    password: zod_1.z.string().min(6).max(100),
    rememberMe: zod_1.z.boolean().optional().default(false),
});
const RefreshSchema = zod_1.z.object({
    refreshToken: zod_1.z.string(),
});
const ForgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
// ─── POST /auth/login ────────────────────────────────────────────────────────
router.post('/login', rateLimit_middleware_1.rateLimitAuth, (0, validation_middleware_1.validate)(LoginSchema), async (req, res) => {
    const { username, password, rememberMe } = req.body;
    // Find user by username or email
    const result = await (0, database_service_1.query)(`SELECT u.id, u.username, u.email, u.password_hash, u.full_name, u.role,
            u.status, u.login_attempts, u.locked_until, u.badge_number,
            u.station_id, u.district_id, u.rank, u.avatar_url, u.two_factor_enabled,
            ps.name AS station_name, d.name AS district_name
     FROM users u
     LEFT JOIN police_stations ps ON ps.id = u.station_id
     LEFT JOIN districts d ON d.id = u.district_id
     WHERE u.username = $1 OR u.email = $1`, [username]);
    if (result.rowCount === 0) {
        // Don't reveal whether user exists
        throw new error_middleware_1.AppError('Invalid username or password', 401, 'INVALID_CREDENTIALS');
    }
    const user = result.rows[0];
    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
        const minutesLeft = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60000);
        throw new error_middleware_1.AppError(`Account locked due to too many failed attempts. Try again in ${minutesLeft} minutes.`, 423, 'ACCOUNT_LOCKED');
    }
    // Check account status
    if (user.status !== 'active') {
        throw new error_middleware_1.AppError(`Your account is ${user.status}. Contact administrator.`, 403, 'ACCOUNT_INACTIVE');
    }
    // Verify password
    const isValid = await bcryptjs_1.default.compare(password, user.password_hash);
    if (!isValid) {
        // Increment login attempts
        const attempts = user.login_attempts + 1;
        const lockUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
        await (0, database_service_1.query)('UPDATE users SET login_attempts = $1, locked_until = $2 WHERE id = $3', [attempts, lockUntil, user.id]);
        await (0, audit_middleware_1.writeAuditLog)({
            userId: user.id,
            action: 'LOGIN_FAILED',
            resourceType: 'auth',
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            status: 'failure',
            errorMessage: 'Invalid password',
        });
        throw new error_middleware_1.AppError('Invalid username or password', 401, 'INVALID_CREDENTIALS');
    }
    // Generate tokens
    const tokenPayload = {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        stationId: user.station_id,
        districtId: user.district_id,
    };
    const accessToken = (0, auth_middleware_1.generateAccessToken)(tokenPayload);
    const refreshToken = (0, auth_middleware_1.generateRefreshToken)(user.id);
    // Store refresh token hash
    const refreshTokenHash = await bcryptjs_1.default.hash(refreshToken, 10);
    await (0, database_service_1.query)(`UPDATE users SET
       login_attempts = 0,
       locked_until = NULL,
       last_login = NOW(),
       refresh_token_hash = $1
     WHERE id = $2`, [refreshTokenHash, user.id]);
    await (0, audit_middleware_1.writeAuditLog)({
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        resourceType: 'auth',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'success',
    });
    logger_1.logger.info('User logged in', { userId: user.id, username: user.username });
    res.json({
        success: true,
        data: {
            accessToken,
            refreshToken: rememberMe ? refreshToken : undefined,
            expiresIn: 900, // 15 minutes
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
                badgeNumber: user.badge_number,
                rank: user.rank,
                stationId: user.station_id,
                stationName: user.station_name,
                districtId: user.district_id,
                districtName: user.district_name,
                avatarUrl: user.avatar_url,
                twoFactorEnabled: user.two_factor_enabled,
            },
        },
    });
});
// ─── POST /auth/logout ───────────────────────────────────────────────────────
router.post('/logout', auth_middleware_2.authenticate, async (req, res) => {
    await (0, database_service_1.query)('UPDATE users SET refresh_token_hash = NULL WHERE id = $1', [req.user.userId]);
    await (0, audit_middleware_1.writeAuditLog)({
        userId: req.user.userId,
        action: 'LOGOUT',
        resourceType: 'auth',
        ipAddress: req.ip,
        status: 'success',
    });
    res.json({ success: true, message: 'Logged out successfully' });
});
// ─── GET /auth/me ────────────────────────────────────────────────────────────
router.get('/me', auth_middleware_2.authenticate, async (req, res) => {
    const result = await (0, database_service_1.query)(`SELECT u.id, u.username, u.email, u.full_name, u.role, u.status,
            u.badge_number, u.rank, u.phone, u.avatar_url, u.last_login,
            u.two_factor_enabled, u.preferences, u.created_at,
            u.station_id, u.district_id,
            ps.name AS station_name, d.name AS district_name
     FROM users u
     LEFT JOIN police_stations ps ON ps.id = u.station_id
     LEFT JOIN districts d ON d.id = u.district_id
     WHERE u.id = $1`, [req.user.userId]);
    if (result.rowCount === 0) {
        throw new error_middleware_1.AppError('User not found', 404, 'NOT_FOUND');
    }
    const user = result.rows[0];
    res.json({ success: true, data: user });
});
// ─── POST /auth/refresh ──────────────────────────────────────────────────────
router.post('/refresh', (0, validation_middleware_1.validate)(RefreshSchema), async (req, res) => {
    const { refreshToken } = req.body;
    let decoded;
    try {
        decoded = (0, auth_middleware_1.verifyRefreshToken)(refreshToken);
    }
    catch {
        throw new error_middleware_1.AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }
    const result = await (0, database_service_1.query)(`SELECT id, username, email, role, status, refresh_token_hash,
            station_id, district_id FROM users WHERE id = $1`, [decoded.userId]);
    if (result.rowCount === 0) {
        throw new error_middleware_1.AppError('User not found', 401, 'INVALID_REFRESH_TOKEN');
    }
    const user = result.rows[0];
    if (user.status !== 'active') {
        throw new error_middleware_1.AppError('Account is not active', 403, 'ACCOUNT_INACTIVE');
    }
    // Verify token matches stored hash
    const isValid = await bcryptjs_1.default.compare(refreshToken, user.refresh_token_hash || '');
    if (!isValid) {
        throw new error_middleware_1.AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }
    // Generate new access token
    const accessToken = (0, auth_middleware_1.generateAccessToken)({
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        stationId: user.station_id,
        districtId: user.district_id,
    });
    res.json({
        success: true,
        data: { accessToken, expiresIn: 900 },
    });
});
// ─── POST /auth/forgot-password ──────────────────────────────────────────────
router.post('/forgot-password', rateLimit_middleware_1.rateLimitAuth, (0, validation_middleware_1.validate)(ForgotPasswordSchema), async (req, res) => {
    const { email } = req.body;
    // Always return success to prevent email enumeration
    const result = await (0, database_service_1.query)('SELECT id, full_name FROM users WHERE email = $1 AND status = $2', [email, 'active']);
    if (result.rowCount && result.rowCount > 0) {
        // TODO: Send reset email via nodemailer
        logger_1.logger.info('Password reset requested', { email });
        await (0, audit_middleware_1.writeAuditLog)({
            action: 'PASSWORD_RESET_REQUESTED',
            resourceType: 'auth',
            ipAddress: req.ip,
            status: 'success',
        });
    }
    res.json({
        success: true,
        message: 'If an account exists with that email, a reset link has been sent.',
    });
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map