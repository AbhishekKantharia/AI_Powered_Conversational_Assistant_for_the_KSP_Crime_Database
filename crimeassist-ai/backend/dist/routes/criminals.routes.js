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
const publicSeedData_service_1 = require("../services/publicSeedData.service");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, rateLimit_middleware_1.rateLimitGeneral);
// ─── Schemas ─────────────────────────────────────────────────────────────────
const CriminalFilterSchema = validation_middleware_1.PaginationSchema.extend({
    riskLevel: zod_1.z.string().optional(),
    isWanted: zod_1.z.coerce.boolean().optional(),
    isArrested: zod_1.z.coerce.boolean().optional(),
    districtId: zod_1.z.string().uuid().optional(),
    search: zod_1.z.string().max(200).optional(),
    gender: zod_1.z.string().optional(),
});
const CreateCriminalSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2).max(150),
    aliases: zod_1.z.array(zod_1.z.string()).optional(),
    dateOfBirth: zod_1.z.string().optional(),
    age: zod_1.z.number().int().optional(),
    gender: zod_1.z.enum(['male', 'female', 'other', 'unknown']).default('male'),
    nationality: zod_1.z.string().default('Indian'),
    education: zod_1.z.string().optional(),
    occupation: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    districtId: zod_1.z.string().uuid().optional(),
    phone: zod_1.z.string().optional(),
    riskLevel: zod_1.z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    isWanted: zod_1.z.boolean().default(false),
    rewardAmount: zod_1.z.number().optional(),
    modusOperandi: zod_1.z.string().optional(),
    crimeSpecialization: zod_1.z.array(zod_1.z.string()).optional(),
    fatherName: zod_1.z.string().optional(),
    motherName: zod_1.z.string().optional(),
});
// ─── GET /criminals ──────────────────────────────────────────────────────────
router.get('/', (0, rbac_middleware_1.requirePermission)('criminals:read'), (0, validation_middleware_1.validate)(CriminalFilterSchema, 'query'), async (req, res) => {
    const { page, limit, offset } = (0, database_service_1.buildPagination)(req.query);
    const { riskLevel, isWanted, isArrested, districtId, search, gender, sortBy, sortOrder } = req.query;
    const conditions = [];
    const params = [];
    let idx = 1;
    if (riskLevel) {
        conditions.push(`cr.risk_level = $${idx++}`);
        params.push(riskLevel);
    }
    if (isWanted !== undefined) {
        conditions.push(`cr.is_wanted = $${idx++}`);
        params.push(isWanted === 'true');
    }
    if (isArrested !== undefined) {
        conditions.push(`cr.is_arrested = $${idx++}`);
        params.push(isArrested === 'true');
    }
    if (districtId) {
        conditions.push(`cr.district_id = $${idx++}`);
        params.push(districtId);
    }
    if (gender) {
        conditions.push(`cr.gender = $${idx++}`);
        params.push(gender);
    }
    if (search) {
        conditions.push(`(cr.full_name ILIKE $${idx} OR cr.criminal_id ILIKE $${idx} OR $${idx} = ANY(cr.aliases::text[]))`);
        params.push(`%${search}%`);
        idx++;
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderField = sortBy === 'risk' ? 'cr.risk_score' : sortBy === 'name' ? 'cr.full_name' : 'cr.created_at';
    const orderDir = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const [rows, count] = await Promise.all([
        (0, database_service_1.query)(`SELECT cr.id, cr.criminal_id, cr.full_name, cr.aliases, cr.age, cr.gender,
              cr.risk_level, cr.risk_score, cr.is_wanted, cr.is_arrested, cr.is_absconding,
              cr.reward_amount, cr.photo_url, cr.total_cases, cr.total_convictions,
              cr.active_cases, cr.crime_specialization, cr.last_known_location,
              d.name AS district_name, cr.created_at
       FROM criminals cr
       LEFT JOIN districts d ON d.id = cr.district_id
       ${whereClause}
       ORDER BY ${orderField} ${orderDir}
       LIMIT $${idx} OFFSET $${idx + 1}`, [...params, limit, offset]),
        (0, database_service_1.query)(`SELECT COUNT(*) FROM criminals cr ${whereClause}`, params),
    ]);
    const total = parseInt(count.rows[0].count);
    // Fallback to public data when DB is empty
    if (total === 0) {
        const pubResult = await (0, publicSeedData_service_1.getPublicCriminals)({ search, riskLevel, isWanted, gender, page, limit });
        return res.json({ success: true, ...pubResult });
    }
    res.json({ success: true, ...(0, database_service_1.buildPaginatedResponse)(rows.rows, total, page, limit) });
});
// ─── GET /criminals/:id ──────────────────────────────────────────────────────
router.get('/:id', (0, rbac_middleware_1.requirePermission)('criminals:read'), (0, validation_middleware_1.validate)(validation_middleware_1.UUIDSchema, 'params'), async (req, res) => {
    const [criminal, cases] = await Promise.all([
        (0, database_service_1.query)(`SELECT cr.*, d.name AS district_name
       FROM criminals cr
       LEFT JOIN districts d ON d.id = cr.district_id
       WHERE cr.id = $1`, [req.params.id]),
        (0, database_service_1.query)(`SELECT c.id, c.case_number, c.title, c.crime_category, c.status, c.case_registered_date,
              s.role_in_crime, s.is_arrested AS suspect_arrested
       FROM suspects s
       JOIN cases c ON c.id = s.case_id
       WHERE s.criminal_id = $1
       ORDER BY c.case_registered_date DESC`, [req.params.id]),
    ]);
    if (criminal.rowCount === 0) {
        // Fallback to public data
        const pubCriminal = (0, publicSeedData_service_1.getPublicCriminalById)(req.params.id);
        if (pubCriminal)
            return res.json({ success: true, data: pubCriminal });
        throw new error_middleware_1.AppError('Criminal not found', 404, 'NOT_FOUND');
    }
    res.json({ success: true, data: { ...criminal.rows[0], cases: cases.rows } });
});
// ─── POST /criminals ─────────────────────────────────────────────────────────
router.post('/', (0, rbac_middleware_1.requirePermission)('criminals:create'), (0, validation_middleware_1.validate)(CreateCriminalSchema), async (req, res) => {
    const criminalId = `KSP-CR-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
    const { fullName, aliases, dateOfBirth, age, gender, nationality, education, occupation, address, districtId, phone, riskLevel, isWanted, rewardAmount, modusOperandi, crimeSpecialization, fatherName, motherName } = req.body;
    // Calculate risk score from risk level
    const riskScoreMap = { low: 25, medium: 50, high: 75, critical: 95 };
    const riskScore = riskScoreMap[riskLevel] || 50;
    const result = await (0, database_service_1.query)(`INSERT INTO criminals
     (criminal_id, full_name, aliases, date_of_birth, age, gender, nationality,
      education, occupation, address, district_id, phone, risk_level, risk_score,
      is_wanted, reward_amount, modus_operandi, crime_specialization,
      father_name, mother_name)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
     RETURNING *`, [criminalId, fullName, aliases || [], dateOfBirth || null, age || null, gender,
        nationality, education || null, occupation || null, address || null,
        districtId || null, phone || null, riskLevel, riskScore, isWanted || false,
        rewardAmount || null, modusOperandi || null, crimeSpecialization || [],
        fatherName || null, motherName || null]);
    await (0, audit_middleware_1.writeAuditLog)({
        userId: req.user.userId,
        action: 'CREATE_CRIMINAL',
        resourceType: 'criminals',
        resourceId: result.rows[0].id,
        newValues: req.body,
        ipAddress: req.ip,
        status: 'success',
    });
    res.status(201).json({ success: true, data: result.rows[0] });
});
// ─── PUT /criminals/:id ───────────────────────────────────────────────────────
router.put('/:id', (0, rbac_middleware_1.requirePermission)('criminals:update'), (0, validation_middleware_1.validate)(validation_middleware_1.UUIDSchema, 'params'), async (req, res) => {
    const existing = await (0, database_service_1.query)('SELECT * FROM criminals WHERE id = $1', [req.params.id]);
    if (existing.rowCount === 0)
        throw new error_middleware_1.AppError('Criminal not found', 404, 'NOT_FOUND');
    const { fullName, aliases, riskLevel, isWanted, isArrested, isAbsconding, lastKnownLocation, rewardAmount, address, phone, crimeSpecialization } = req.body;
    const riskScoreMap = { low: 25, medium: 50, high: 75, critical: 95 };
    const result = await (0, database_service_1.query)(`UPDATE criminals SET
       full_name = COALESCE($1, full_name),
       aliases = COALESCE($2, aliases),
       risk_level = COALESCE($3, risk_level),
       risk_score = COALESCE($4, risk_score),
       is_wanted = COALESCE($5, is_wanted),
       is_arrested = COALESCE($6, is_arrested),
       is_absconding = COALESCE($7, is_absconding),
       last_known_location = COALESCE($8, last_known_location),
       reward_amount = COALESCE($9, reward_amount),
       address = COALESCE($10, address),
       phone = COALESCE($11, phone),
       crime_specialization = COALESCE($12, crime_specialization),
       updated_at = NOW()
     WHERE id = $13 RETURNING *`, [fullName, aliases, riskLevel, riskLevel ? riskScoreMap[riskLevel] : null,
        isWanted, isArrested, isAbsconding, lastKnownLocation, rewardAmount,
        address, phone, crimeSpecialization, req.params.id]);
    await (0, audit_middleware_1.writeAuditLog)({
        userId: req.user.userId,
        action: 'UPDATE_CRIMINAL',
        resourceType: 'criminals',
        resourceId: req.params.id,
        oldValues: existing.rows[0],
        newValues: req.body,
        ipAddress: req.ip,
        status: 'success',
    });
    res.json({ success: true, data: result.rows[0] });
});
// ─── GET /criminals/wanted ────────────────────────────────────────────────────
router.get('/wanted', (0, rbac_middleware_1.requirePermission)('criminals:read'), async (_req, res) => {
    const result = await (0, database_service_1.query)(`SELECT * FROM v_wanted_criminals LIMIT 50`);
    // Fallback to public data when DB is empty
    if (result.rowCount === 0) {
        return res.json({ success: true, data: (0, publicSeedData_service_1.getPublicWantedCriminals)() });
    }
    res.json({ success: true, data: result.rows });
});
// ─── DELETE /criminals/:id ────────────────────────────────────────────────────
router.delete('/:id', (0, rbac_middleware_1.requirePermission)('criminals:delete'), (0, validation_middleware_1.validate)(validation_middleware_1.UUIDSchema, 'params'), async (req, res) => {
    const existing = await (0, database_service_1.query)('SELECT * FROM criminals WHERE id = $1', [req.params.id]);
    if (existing.rowCount === 0)
        throw new error_middleware_1.AppError('Criminal not found', 404, 'NOT_FOUND');
    await (0, database_service_1.query)('DELETE FROM suspects WHERE criminal_id = $1', [req.params.id]);
    await (0, database_service_1.query)('DELETE FROM criminals WHERE id = $1', [req.params.id]);
    await (0, audit_middleware_1.writeAuditLog)({
        userId: req.user.userId,
        action: 'DELETE_CRIMINAL',
        resourceType: 'criminals',
        resourceId: req.params.id,
        oldValues: existing.rows[0],
        ipAddress: req.ip,
        status: 'success',
    });
    res.json({ success: true, message: 'Criminal record deleted' });
});
exports.default = router;
//# sourceMappingURL=criminals.routes.js.map