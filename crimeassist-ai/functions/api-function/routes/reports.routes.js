"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const database_service_1 = require("../services/database.service");
const error_middleware_1 = require("../middleware/error.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, rateLimit_middleware_1.rateLimitGeneral);
// ─── POST /reports ─────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
    const { title, type, districtId, stationId, dateFrom, dateTo, parameters } = req.body;
    const result = await (0, database_service_1.query)(`INSERT INTO reports (title, type, generated_by, district_id, station_id, date_from, date_to, parameters, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending')
     RETURNING *`, [title, type, req.user.userId, districtId || null, stationId || null,
        dateFrom || null, dateTo || null, JSON.stringify(parameters || {})]);
    // In production: trigger async report generation job
    res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Report generation started. Download will be available shortly.',
    });
});
// ─── GET /reports ──────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
    const result = await (0, database_service_1.query)(`SELECT r.*, u.full_name AS generated_by_name
     FROM reports r LEFT JOIN users u ON u.id = r.generated_by
     WHERE r.generated_by = $1 OR $2 = 'administrator'
     ORDER BY r.created_at DESC LIMIT 50`, [req.user.userId, req.user.role]);
    res.json({ success: true, data: result.rows });
});
// ─── GET /reports/:id ──────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
    const result = await (0, database_service_1.query)('SELECT * FROM reports WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0)
        throw new error_middleware_1.AppError('Report not found', 404, 'NOT_FOUND');
    res.json({ success: true, data: result.rows[0] });
});
// ─── DELETE /reports/:id ───────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
    await (0, database_service_1.query)('DELETE FROM reports WHERE id = $1 AND generated_by = $2', [req.params.id, req.user.userId]);
    res.json({ success: true, message: 'Report deleted' });
});
exports.default = router;
//# sourceMappingURL=reports.routes.js.map