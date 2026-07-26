"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const database_service_1 = require("../services/database.service");
const error_middleware_1 = require("../middleware/error.middleware");
const audit_middleware_1 = require("../middleware/audit.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, rateLimit_middleware_1.rateLimitGeneral);
const CreateUserSchema = zod_1.z.object({
    username: zod_1.z.string().min(3).max(50),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8).max(100),
    fullName: zod_1.z.string().min(2).max(150),
    role: zod_1.z.enum(['administrator', 'police_officer', 'investigation_officer', 'crime_analyst']),
    badgeNumber: zod_1.z.string().min(3).max(20),
    rank: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    stationId: zod_1.z.string().uuid().optional(),
    districtId: zod_1.z.string().uuid().optional(),
});
const UpdateUserSchema = CreateUserSchema.omit({ password: true }).partial();
// ─── GET /users ───────────────────────────────────────────────────────────────
router.get('/', (0, rbac_middleware_1.requirePermission)('users:read'), (0, validation_middleware_1.validate)(validation_middleware_1.PaginationSchema, 'query'), async (req, res) => {
    const { page, limit, offset } = (0, database_service_1.buildPagination)(req.query);
    const search = req.query.search;
    const role = req.query.role;
    const conditions = [];
    const params = [];
    let idx = 1;
    if (role) {
        conditions.push(`u.role = $${idx++}`);
        params.push(role);
    }
    if (search) {
        conditions.push(`(u.full_name ILIKE $${idx} OR u.username ILIKE $${idx} OR u.badge_number ILIKE $${idx})`);
        params.push(`%${search}%`);
        idx++;
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows, count] = await Promise.all([
        (0, database_service_1.query)(`SELECT u.id, u.username, u.email, u.full_name, u.role, u.status,
              u.badge_number, u.rank, u.phone, u.last_login, u.created_at,
              ps.name AS station_name, d.name AS district_name
       FROM users u
       LEFT JOIN police_stations ps ON ps.id = u.station_id
       LEFT JOIN districts d ON d.id = u.district_id
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`, [...params, limit, offset]),
        (0, database_service_1.query)(`SELECT COUNT(*) FROM users u ${whereClause}`, params),
    ]);
    const total = parseInt(count.rows[0].count);
    res.json({ success: true, ...(0, database_service_1.buildPaginatedResponse)(rows.rows, total, page, limit) });
});
// ─── POST /users ──────────────────────────────────────────────────────────────
router.post('/', (0, rbac_middleware_1.requirePermission)('users:create'), (0, validation_middleware_1.validate)(CreateUserSchema), async (req, res) => {
    const { username, email, password, fullName, role, badgeNumber, rank, phone, stationId, districtId } = req.body;
    // Check unique constraints
    const existing = await (0, database_service_1.query)('SELECT id FROM users WHERE username = $1 OR email = $2 OR badge_number = $3', [username, email, badgeNumber]);
    if (existing.rowCount && existing.rowCount > 0) {
        throw new error_middleware_1.AppError('Username, email, or badge number already exists', 409, 'DUPLICATE_USER');
    }
    const passwordHash = await bcryptjs_1.default.hash(password, parseInt(process.env.BCRYPT_ROUNDS || '12'));
    const result = await (0, database_service_1.query)(`INSERT INTO users (username, email, password_hash, full_name, role, badge_number, rank, phone, station_id, district_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id, username, email, full_name, role, badge_number, created_at`, [username, email, passwordHash, fullName, role, badgeNumber, rank || null, phone || null, stationId || null, districtId || null]);
    await (0, audit_middleware_1.writeAuditLog)({
        userId: req.user.userId,
        action: 'CREATE_USER',
        resourceType: 'users',
        resourceId: result.rows[0].id,
        newValues: { username, email, role, badgeNumber },
        ipAddress: req.ip,
        status: 'success',
    });
    res.status(201).json({ success: true, data: result.rows[0] });
});
// ─── PUT /users/:id ───────────────────────────────────────────────────────────
router.put('/:id', (0, rbac_middleware_1.requirePermission)('users:update'), (0, validation_middleware_1.validate)(validation_middleware_1.UUIDSchema, 'params'), (0, validation_middleware_1.validate)(UpdateUserSchema), async (req, res) => {
    const { fullName, role, status, rank, phone, stationId, districtId } = req.body;
    const result = await (0, database_service_1.query)(`UPDATE users SET
       full_name = COALESCE($1, full_name),
       role = COALESCE($2, role),
       status = COALESCE($3, status),
       rank = COALESCE($4, rank),
       phone = COALESCE($5, phone),
       station_id = COALESCE($6, station_id),
       district_id = COALESCE($7, district_id),
       updated_at = NOW()
     WHERE id = $8 RETURNING id, username, email, full_name, role, status, badge_number`, [fullName, role, status, rank, phone, stationId, districtId, req.params.id]);
    if (result.rowCount === 0)
        throw new error_middleware_1.AppError('User not found', 404, 'NOT_FOUND');
    await (0, audit_middleware_1.writeAuditLog)({
        userId: req.user.userId,
        action: 'UPDATE_USER',
        resourceType: 'users',
        resourceId: req.params.id,
        newValues: req.body,
        ipAddress: req.ip,
        status: 'success',
    });
    res.json({ success: true, data: result.rows[0] });
});
// ─── DELETE /users/:id ────────────────────────────────────────────────────────
router.delete('/:id', (0, rbac_middleware_1.requirePermission)('users:delete'), (0, validation_middleware_1.validate)(validation_middleware_1.UUIDSchema, 'params'), async (req, res) => {
    if (req.params.id === req.user.userId) {
        throw new error_middleware_1.AppError('Cannot delete your own account', 400, 'SELF_DELETE');
    }
    const existing = await (0, database_service_1.query)('SELECT id FROM users WHERE id = $1', [req.params.id]);
    if (existing.rowCount === 0)
        throw new error_middleware_1.AppError('User not found', 404, 'NOT_FOUND');
    // Soft delete
    await (0, database_service_1.query)('UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2', ['inactive', req.params.id]);
    await (0, audit_middleware_1.writeAuditLog)({
        userId: req.user.userId,
        action: 'DELETE_USER',
        resourceType: 'users',
        resourceId: req.params.id,
        ipAddress: req.ip,
        status: 'success',
    });
    res.json({ success: true, message: 'User deactivated' });
});
// ─── GET /users/audit-logs ────────────────────────────────────────────────────
router.get('/audit-logs', (0, rbac_middleware_1.requirePermission)('audit:read'), (0, validation_middleware_1.validate)(validation_middleware_1.PaginationSchema, 'query'), async (req, res) => {
    const { page, limit, offset } = (0, database_service_1.buildPagination)(req.query);
    const [rows, count] = await Promise.all([
        (0, database_service_1.query)(`SELECT al.*, u.full_name AS user_name, u.badge_number
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       ORDER BY al.created_at DESC
       LIMIT $1 OFFSET $2`, [limit, offset]),
        (0, database_service_1.query)('SELECT COUNT(*) FROM audit_logs'),
    ]);
    const total = parseInt(count.rows[0].count);
    res.json({ success: true, ...(0, database_service_1.buildPaginatedResponse)(rows.rows, total, page, limit) });
});
exports.default = router;
//# sourceMappingURL=users.routes.js.map