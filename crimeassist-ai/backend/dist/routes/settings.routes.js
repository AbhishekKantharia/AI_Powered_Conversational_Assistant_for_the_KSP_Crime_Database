"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const database_service_1 = require("../services/database.service");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, rateLimit_middleware_1.rateLimitGeneral);
// ─── GET /settings ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
    const userResult = await (0, database_service_1.query)(`SELECT id, username, email, full_name, role, badge_number, rank, phone, avatar_url,
            preferences, two_factor_enabled, created_at, last_login
     FROM users WHERE id = $1`, [req.user.userId]);
    const districtsResult = await (0, database_service_1.query)('SELECT id, name, code FROM districts ORDER BY name');
    const stationsResult = await (0, database_service_1.query)(`SELECT ps.id, ps.name, ps.code, d.name AS district_name
     FROM police_stations ps JOIN districts d ON d.id = ps.district_id
     ORDER BY ps.name`);
    res.json({
        success: true,
        data: {
            profile: userResult.rows[0],
            districts: districtsResult.rows,
            stations: stationsResult.rows,
        },
    });
});
// ─── PUT /settings/profile ─────────────────────────────────────────────────────
router.put('/profile', async (req, res) => {
    const { fullName, phone, preferences } = req.body;
    const result = await (0, database_service_1.query)(`UPDATE users SET
       full_name = COALESCE($1, full_name),
       phone = COALESCE($2, phone),
       preferences = COALESCE($3, preferences),
       updated_at = NOW()
     WHERE id = $4 RETURNING id, username, email, full_name, phone, preferences`, [fullName, phone, preferences ? JSON.stringify(preferences) : null, req.user.userId]);
    res.json({ success: true, data: result.rows[0] });
});
exports.default = router;
//# sourceMappingURL=settings.routes.js.map