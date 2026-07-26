"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const database_service_1 = require("../services/database.service");
const error_middleware_1 = require("../middleware/error.middleware");
const audit_middleware_1 = require("../middleware/audit.middleware");
const ai_service_1 = require("../services/ai.service");
const router = (0, express_1.Router)();
// Apply auth to all case routes
router.use(auth_middleware_1.authenticate, rateLimit_middleware_1.rateLimitGeneral);
// ─── Validation Schemas ──────────────────────────────────────────────────────
const CaseFilterSchema = validation_middleware_1.PaginationSchema.extend({
    status: zod_1.z.string().optional(),
    crimeCategory: zod_1.z.string().optional(),
    districtId: zod_1.z.string().uuid().optional(),
    stationId: zod_1.z.string().uuid().optional(),
    officerId: zod_1.z.string().uuid().optional(),
    dateFrom: zod_1.z.string().optional(),
    dateTo: zod_1.z.string().optional(),
    priority: zod_1.z.coerce.number().int().min(1).max(5).optional(),
    search: zod_1.z.string().max(200).optional(),
});
const CreateCaseSchema = zod_1.z.object({
    firId: zod_1.z.string().uuid().optional(),
    title: zod_1.z.string().min(5).max(255),
    description: zod_1.z.string().optional(),
    crimeCategory: zod_1.z.string(),
    priority: zod_1.z.number().int().min(1).max(5).default(3),
    districtId: zod_1.z.string().uuid(),
    stationId: zod_1.z.string().uuid(),
    assignedOfficerId: zod_1.z.string().uuid().optional(),
    incidentDate: zod_1.z.string().datetime().optional(),
    ipcSections: zod_1.z.array(zod_1.z.string()).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
});
const UpdateCaseSchema = CreateCaseSchema.partial().extend({
    status: zod_1.z.string().optional(),
    courtName: zod_1.z.string().optional(),
    courtCaseNumber: zod_1.z.string().optional(),
    chargesheetFiledDate: zod_1.z.string().optional(),
    chargesheetNumber: zod_1.z.string().optional(),
    actualCloseDate: zod_1.z.string().optional(),
});
// ─── GET /cases ──────────────────────────────────────────────────────────────
router.get('/', (0, rbac_middleware_1.requirePermission)('cases:read'), (0, validation_middleware_1.validate)(CaseFilterSchema, 'query'), async (req, res) => {
    const { page, limit, offset } = (0, database_service_1.buildPagination)(req.query);
    const { status, crimeCategory, districtId, stationId, officerId, dateFrom, dateTo, priority, search, sortBy, sortOrder } = req.query;
    const conditions = [];
    const params = [];
    let paramIdx = 1;
    // Role-based filtering: officers only see their station's cases
    if (req.user.role === 'police_officer') {
        conditions.push(`c.station_id = $${paramIdx++}`);
        params.push(req.user.stationId);
    }
    if (status) {
        conditions.push(`c.status = $${paramIdx++}`);
        params.push(status);
    }
    if (crimeCategory) {
        conditions.push(`c.crime_category = $${paramIdx++}`);
        params.push(crimeCategory);
    }
    if (districtId) {
        conditions.push(`c.district_id = $${paramIdx++}`);
        params.push(districtId);
    }
    if (stationId) {
        conditions.push(`c.station_id = $${paramIdx++}`);
        params.push(stationId);
    }
    if (officerId) {
        conditions.push(`c.assigned_officer_id = $${paramIdx++}`);
        params.push(officerId);
    }
    if (priority) {
        conditions.push(`c.priority = $${paramIdx++}`);
        params.push(priority);
    }
    if (dateFrom) {
        conditions.push(`c.case_registered_date >= $${paramIdx++}`);
        params.push(dateFrom);
    }
    if (dateTo) {
        conditions.push(`c.case_registered_date <= $${paramIdx++}`);
        params.push(dateTo);
    }
    if (search) {
        conditions.push(`(c.title ILIKE $${paramIdx} OR c.case_number ILIKE $${paramIdx} OR c.description ILIKE $${paramIdx})`);
        params.push(`%${search}%`);
        paramIdx++;
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderField = sortBy === 'priority' ? 'c.priority' : sortBy === 'date' ? 'c.case_registered_date' : 'c.created_at';
    const orderDir = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const [dataResult, countResult] = await Promise.all([
        (0, database_service_1.query)(`SELECT c.id, c.case_number, c.title, c.crime_category, c.status, c.priority,
              c.ai_risk_score, c.case_registered_date, c.incident_date, c.tags,
              d.name AS district_name, ps.name AS station_name,
              u.full_name AS assigned_officer, u.badge_number AS officer_badge,
              COUNT(DISTINCT s.id) AS suspect_count,
              COUNT(DISTINCT v.id) AS victim_count,
              COUNT(DISTINCT e.id) AS evidence_count
       FROM cases c
       LEFT JOIN districts d ON d.id = c.district_id
       LEFT JOIN police_stations ps ON ps.id = c.station_id
       LEFT JOIN users u ON u.id = c.assigned_officer_id
       LEFT JOIN suspects s ON s.case_id = c.id
       LEFT JOIN victims v ON v.case_id = c.id
       LEFT JOIN evidence e ON e.case_id = c.id
       ${whereClause}
       GROUP BY c.id, d.name, ps.name, u.full_name, u.badge_number
       ORDER BY ${orderField} ${orderDir}
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`, [...params, limit, offset]),
        (0, database_service_1.query)(`SELECT COUNT(*) FROM cases c ${whereClause}`, params),
    ]);
    const total = parseInt(countResult.rows[0].count);
    res.json({
        success: true,
        ...(0, database_service_1.buildPaginatedResponse)(dataResult.rows, total, page, limit),
    });
});
// ─── GET /cases/:id ──────────────────────────────────────────────────────────
router.get('/:id', (0, rbac_middleware_1.requirePermission)('cases:read'), (0, validation_middleware_1.validate)(validation_middleware_1.UUIDSchema, 'params'), async (req, res) => {
    const { id } = req.params;
    const [caseResult, suspectsResult, victimsResult, evidenceResult, notesResult] = await Promise.all([
        (0, database_service_1.query)(`SELECT c.*, d.name AS district_name, ps.name AS station_name,
              u.full_name AS assigned_officer, u.badge_number AS officer_badge,
              u.rank AS officer_rank, u2.full_name AS supervisor_name,
              f.fir_number
       FROM cases c
       LEFT JOIN districts d ON d.id = c.district_id
       LEFT JOIN police_stations ps ON ps.id = c.station_id
       LEFT JOIN users u ON u.id = c.assigned_officer_id
       LEFT JOIN users u2 ON u2.id = c.supervisor_id
       LEFT JOIN fir f ON f.id = c.fir_id
       WHERE c.id = $1`, [id]),
        (0, database_service_1.query)(`SELECT s.*, cr.full_name AS criminal_name, cr.photo_url FROM suspects s
           LEFT JOIN criminals cr ON cr.id = s.criminal_id WHERE s.case_id = $1`, [id]),
        (0, database_service_1.query)('SELECT * FROM victims WHERE case_id = $1', [id]),
        (0, database_service_1.query)(`SELECT e.*, u.full_name AS collected_by_name FROM evidence e
           LEFT JOIN users u ON u.id = e.collected_by WHERE e.case_id = $1 ORDER BY e.found_date`, [id]),
        (0, database_service_1.query)(`SELECT cn.*, u.full_name AS author_name, u.avatar_url AS author_avatar,
                  u.role AS author_role
           FROM case_notes cn
           LEFT JOIN users u ON u.id = cn.author_id
           WHERE cn.case_id = $1 ORDER BY cn.created_at DESC`, [id]),
    ]);
    if (caseResult.rowCount === 0)
        throw new error_middleware_1.AppError('Case not found', 404, 'NOT_FOUND');
    res.json({
        success: true,
        data: {
            ...caseResult.rows[0],
            suspects: suspectsResult.rows,
            victims: victimsResult.rows,
            evidence: evidenceResult.rows,
            notes: notesResult.rows,
        },
    });
});
// ─── POST /cases ─────────────────────────────────────────────────────────────
router.post('/', (0, rbac_middleware_1.requirePermission)('cases:create'), (0, validation_middleware_1.validate)(CreateCaseSchema), async (req, res) => {
    const caseNumber = `KSP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const { firId, title, description, crimeCategory, priority, districtId, stationId, assignedOfficerId, incidentDate, ipcSections, tags } = req.body;
    const result = await (0, database_service_1.query)(`INSERT INTO cases
     (case_number, fir_id, title, description, crime_category, priority,
      district_id, station_id, assigned_officer_id, incident_date,
      ipc_sections, tags, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'registered')
     RETURNING *`, [caseNumber, firId || null, title, description || null, crimeCategory, priority,
        districtId, stationId, assignedOfficerId || null, incidentDate || null,
        ipcSections || [], tags || []]);
    const newCase = result.rows[0];
    // Generate AI summary asynchronously
    ai_service_1.aiService.generateCaseSummary(newCase.id).catch((err) => {
        console.error('Failed to generate AI summary:', err);
    });
    await (0, audit_middleware_1.writeAuditLog)({
        userId: req.user.userId,
        action: 'CREATE_CASE',
        resourceType: 'cases',
        resourceId: newCase.id,
        newValues: req.body,
        ipAddress: req.ip,
        status: 'success',
    });
    res.status(201).json({ success: true, data: newCase });
});
// ─── PUT /cases/:id ──────────────────────────────────────────────────────────
router.put('/:id', (0, rbac_middleware_1.requirePermission)('cases:update'), (0, validation_middleware_1.validate)(validation_middleware_1.UUIDSchema, 'params'), (0, validation_middleware_1.validate)(UpdateCaseSchema), async (req, res) => {
    const { id } = req.params;
    const existing = await (0, database_service_1.query)('SELECT * FROM cases WHERE id = $1', [id]);
    if (existing.rowCount === 0)
        throw new error_middleware_1.AppError('Case not found', 404, 'NOT_FOUND');
    const oldCase = existing.rows[0];
    // Officers can only update their assigned cases
    if (req.user.role === 'police_officer' && oldCase.assigned_officer_id !== req.user.userId) {
        throw new error_middleware_1.AppError('You can only update cases assigned to you', 403, 'FORBIDDEN');
    }
    const { title, description, crimeCategory, status, priority, assignedOfficerId, incidentDate, ipcSections, tags, courtName, courtCaseNumber, chargesheetFiledDate, chargesheetNumber, actualCloseDate } = req.body;
    const result = await (0, database_service_1.query)(`UPDATE cases SET
       title = COALESCE($1, title),
       description = COALESCE($2, description),
       crime_category = COALESCE($3, crime_category),
       status = COALESCE($4, status),
       priority = COALESCE($5, priority),
       assigned_officer_id = COALESCE($6, assigned_officer_id),
       incident_date = COALESCE($7, incident_date),
       ipc_sections = COALESCE($8, ipc_sections),
       tags = COALESCE($9, tags),
       court_name = COALESCE($10, court_name),
       court_case_number = COALESCE($11, court_case_number),
       chargesheet_filed_date = COALESCE($12, chargesheet_filed_date),
       chargesheet_number = COALESCE($13, chargesheet_number),
       actual_close_date = COALESCE($14, actual_close_date),
       updated_at = NOW()
     WHERE id = $15
     RETURNING *`, [title, description, crimeCategory, status, priority, assignedOfficerId,
        incidentDate, ipcSections, tags, courtName, courtCaseNumber,
        chargesheetFiledDate, chargesheetNumber, actualCloseDate, id]);
    await (0, audit_middleware_1.writeAuditLog)({
        userId: req.user.userId,
        action: 'UPDATE_CASE',
        resourceType: 'cases',
        resourceId: id,
        oldValues: oldCase,
        newValues: req.body,
        ipAddress: req.ip,
        status: 'success',
    });
    res.json({ success: true, data: result.rows[0] });
});
// ─── DELETE /cases/:id ────────────────────────────────────────────────────────
router.delete('/:id', (0, rbac_middleware_1.requirePermission)('cases:delete'), (0, validation_middleware_1.validate)(validation_middleware_1.UUIDSchema, 'params'), async (req, res) => {
    const { id } = req.params;
    const existing = await (0, database_service_1.query)('SELECT id, case_number FROM cases WHERE id = $1', [id]);
    if (existing.rowCount === 0)
        throw new error_middleware_1.AppError('Case not found', 404, 'NOT_FOUND');
    await (0, database_service_1.query)('DELETE FROM cases WHERE id = $1', [id]);
    await (0, audit_middleware_1.writeAuditLog)({
        userId: req.user.userId,
        action: 'DELETE_CASE',
        resourceType: 'cases',
        resourceId: id,
        oldValues: existing.rows[0],
        ipAddress: req.ip,
        status: 'success',
    });
    res.json({ success: true, message: 'Case deleted successfully' });
});
// ─── POST /cases/:id/notes ───────────────────────────────────────────────────
router.post('/:id/notes', (0, rbac_middleware_1.requirePermission)('cases:update'), async (req, res) => {
    const { id } = req.params;
    const { content, title, noteType, isConfidential } = req.body;
    const result = await (0, database_service_1.query)(`INSERT INTO case_notes (case_id, author_id, note_type, title, content, is_confidential)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [id, req.user.userId, noteType || 'general', title, content, isConfidential || false]);
    res.status(201).json({ success: true, data: result.rows[0] });
});
exports.default = router;
//# sourceMappingURL=cases.routes.js.map