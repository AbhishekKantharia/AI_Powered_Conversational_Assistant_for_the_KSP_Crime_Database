"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const database_service_1 = require("../services/database.service");
const error_middleware_1 = require("../middleware/error.middleware");
const audit_middleware_1 = require("../middleware/audit.middleware");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const fs_1 = __importDefault(require("fs"));
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, rateLimit_middleware_1.rateLimitGeneral);
// Multer setup for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const dir = path_1.default.join(process.cwd(), 'uploads', 'evidence');
        if (!fs_1.default.existsSync(dir))
            fs_1.default.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${(0, uuid_1.v4)()}${ext}`);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4', 'audio/mpeg'];
        cb(null, allowed.includes(file.mimetype));
    },
});
// ─── GET /evidence/case/:caseId ───────────────────────────────────────────────
router.get('/case/:caseId', (0, rbac_middleware_1.requirePermission)('evidence:read'), async (req, res) => {
    const result = await (0, database_service_1.query)(`SELECT e.*, u.full_name AS collected_by_name
     FROM evidence e
     LEFT JOIN users u ON u.id = e.collected_by
     WHERE e.case_id = $1 ORDER BY e.found_date DESC`, [req.params.caseId]);
    res.json({ success: true, data: result.rows });
});
// ─── POST /evidence ───────────────────────────────────────────────────────────
router.post('/', (0, rbac_middleware_1.requirePermission)('evidence:create'), upload.single('file'), async (req, res) => {
    const { caseId, firId, type, title, description, locationFound, foundDate } = req.body;
    const evidenceNumber = `EVD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    let fileUrl = null;
    let fileName = null;
    let fileSize = null;
    let fileMimeType = null;
    if (req.file) {
        fileUrl = `/uploads/evidence/${req.file.filename}`;
        fileName = req.file.originalname;
        fileSize = req.file.size;
        fileMimeType = req.file.mimetype;
    }
    const result = await (0, database_service_1.query)(`INSERT INTO evidence
     (case_id, fir_id, evidence_number, type, title, description,
      location_found, found_date, collected_by, file_url, file_name,
      file_size, file_mime_type)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`, [caseId, firId || null, evidenceNumber, type, title, description || null,
        locationFound || null, foundDate || null, req.user.userId,
        fileUrl, fileName, fileSize, fileMimeType]);
    await (0, audit_middleware_1.writeAuditLog)({
        userId: req.user.userId,
        action: 'CREATE_EVIDENCE',
        resourceType: 'evidence',
        resourceId: result.rows[0].id,
        ipAddress: req.ip,
        status: 'success',
    });
    res.status(201).json({ success: true, data: result.rows[0] });
});
// ─── PUT /evidence/:id ────────────────────────────────────────────────────────
router.put('/:id', (0, rbac_middleware_1.requirePermission)('evidence:update'), (0, validation_middleware_1.validate)(validation_middleware_1.UUIDSchema, 'params'), async (req, res) => {
    const { title, description, isForensicAnalyzed, forensicReport, courtSubmitted } = req.body;
    const result = await (0, database_service_1.query)(`UPDATE evidence SET
       title = COALESCE($1, title),
       description = COALESCE($2, description),
       is_forensic_analyzed = COALESCE($3, is_forensic_analyzed),
       forensic_report = COALESCE($4, forensic_report),
       court_submitted = COALESCE($5, court_submitted),
       updated_at = NOW()
     WHERE id = $6 RETURNING *`, [title, description, isForensicAnalyzed, forensicReport, courtSubmitted, req.params.id]);
    if (result.rowCount === 0)
        throw new error_middleware_1.AppError('Evidence not found', 404, 'NOT_FOUND');
    res.json({ success: true, data: result.rows[0] });
});
// ─── DELETE /evidence/:id ─────────────────────────────────────────────────────
router.delete('/:id', (0, rbac_middleware_1.requirePermission)('evidence:delete'), (0, validation_middleware_1.validate)(validation_middleware_1.UUIDSchema, 'params'), async (req, res) => {
    const evidence = await (0, database_service_1.query)('SELECT file_url FROM evidence WHERE id = $1', [req.params.id]);
    if (evidence.rowCount === 0)
        throw new error_middleware_1.AppError('Evidence not found', 404, 'NOT_FOUND');
    // Delete file if exists
    const fileUrl = evidence.rows[0].file_url;
    if (fileUrl) {
        const filePath = path_1.default.join(process.cwd(), fileUrl);
        if (fs_1.default.existsSync(filePath))
            fs_1.default.unlinkSync(filePath);
    }
    await (0, database_service_1.query)('DELETE FROM evidence WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Evidence deleted' });
});
exports.default = router;
//# sourceMappingURL=evidence.routes.js.map