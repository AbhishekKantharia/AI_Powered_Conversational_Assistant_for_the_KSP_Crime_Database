"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const publicData_service_1 = require("../services/publicData.service");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, rateLimit_middleware_1.rateLimitGeneral);
// ─── GET /public-data/ipc-sections ─────────────────────────────────────────────
router.get('/ipc-sections', (0, rbac_middleware_1.requirePermission)('ai:chat'), async (_req, res) => {
    try {
        const sections = await (0, publicData_service_1.fetchIPCSections)();
        res.json({ success: true, data: sections, count: sections.length });
    }
    catch (error) {
        logger_1.logger.error('Failed to fetch IPC sections:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch IPC sections' });
    }
});
// ─── GET /public-data/ipc-search?q=420 ────────────────────────────────────────
router.get('/ipc-search', (0, rbac_middleware_1.requirePermission)('ai:chat'), async (req, res) => {
    try {
        const q = req.query.q || '';
        if (q.length < 1) {
            res.status(400).json({ success: false, error: 'Search query is required' });
            return;
        }
        const sections = await (0, publicData_service_1.searchIPCSections)(q);
        res.json({ success: true, data: sections, count: sections.length });
    }
    catch (error) {
        logger_1.logger.error('IPC search failed:', error);
        res.status(500).json({ success: false, error: 'IPC search failed' });
    }
});
// ─── GET /public-data/ipc/:sectionNumber ──────────────────────────────────────
router.get('/ipc/:sectionNumber', (0, rbac_middleware_1.requirePermission)('ai:chat'), async (req, res) => {
    try {
        const section = await (0, publicData_service_1.getIPCSectionByNumber)(req.params.sectionNumber);
        if (!section) {
            res.status(404).json({ success: false, error: 'IPC section not found' });
            return;
        }
        res.json({ success: true, data: section });
    }
    catch (error) {
        logger_1.logger.error('IPC lookup failed:', error);
        res.status(500).json({ success: false, error: 'IPC lookup failed' });
    }
});
// ─── GET /public-data/karnataka-crime-stats ────────────────────────────────────
router.get('/karnataka-crime-stats', (0, rbac_middleware_1.requirePermission)('analytics:read'), async (_req, res) => {
    try {
        const stats = await (0, publicData_service_1.fetchKarnatakaCrimeStats)();
        res.json({ success: true, data: stats, count: stats.length });
    }
    catch (error) {
        logger_1.logger.error('Failed to fetch Karnataka crime stats:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch crime statistics' });
    }
});
// ─── GET /public-data/karnataka-districts ──────────────────────────────────────
router.get('/karnataka-districts', (0, rbac_middleware_1.requirePermission)('analytics:read'), async (_req, res) => {
    try {
        const districts = await (0, publicData_service_1.getKarnatakaDistricts)();
        res.json({ success: true, data: districts, count: districts.length });
    }
    catch (error) {
        logger_1.logger.error('Failed to fetch districts:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch districts' });
    }
});
// ─── GET /public-data/police-stations ──────────────────────────────────────────
router.get('/police-stations', (0, rbac_middleware_1.requirePermission)('analytics:read'), async (_req, res) => {
    try {
        const stations = await (0, publicData_service_1.fetchPoliceStations)();
        res.json({ success: true, data: stations, count: stations.length });
    }
    catch (error) {
        logger_1.logger.error('Failed to fetch police stations:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch police stations' });
    }
});
// ─── GET /public-data/ncrb-summary ────────────────────────────────────────────
router.get('/ncrb-summary', (0, rbac_middleware_1.requirePermission)('analytics:read'), async (_req, res) => {
    try {
        const stats = await (0, publicData_service_1.fetchKarnatakaCrimeStats)();
        const totalCrime = stats.reduce((sum, d) => sum + d.totalCrime, 0);
        const byCategory = {};
        for (const s of stats) {
            for (const [key, val] of Object.entries(s)) {
                if (key !== 'district' && key !== 'totalCrime' && typeof val === 'number') {
                    byCategory[key] = (byCategory[key] || 0) + val;
                }
            }
        }
        const topDistricts = [...stats].sort((a, b) => b.totalCrime - a.totalCrime).slice(0, 5);
        res.json({
            success: true,
            data: {
                totalCrime,
                districts: stats.length,
                byCategory,
                topDistricts,
                source: 'NCRB Crime in India / Indian Data Project',
            },
        });
    }
    catch (error) {
        logger_1.logger.error('NCRB summary failed:', error);
        res.status(500).json({ success: false, error: 'Failed to generate NCRB summary' });
    }
});
exports.default = router;
//# sourceMappingURL=public-data.routes.js.map