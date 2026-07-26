import { Router } from 'express'
import { z } from 'zod'
import { authenticate } from '../middleware/auth.middleware'
import { requirePermission } from '../middleware/rbac.middleware'
import { rateLimitGeneral } from '../middleware/rateLimit.middleware'
import { validate, UUIDSchema } from '../middleware/validation.middleware'
import { query } from '../services/database.service'
import { AppError } from '../middleware/error.middleware'
import { writeAuditLog } from '../middleware/audit.middleware'
import multer from 'multer'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'

const router = Router()
router.use(authenticate, rateLimitGeneral)

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'evidence')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${uuidv4()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4', 'audio/mpeg']
    cb(null, allowed.includes(file.mimetype))
  },
})

// ─── GET /evidence/case/:caseId ───────────────────────────────────────────────
router.get('/case/:caseId', requirePermission('evidence:read'), async (req, res) => {
  const result = await query(
    `SELECT e.*, u.full_name AS collected_by_name
     FROM evidence e
     LEFT JOIN users u ON u.id = e.collected_by
     WHERE e.case_id = $1 ORDER BY e.found_date DESC`,
    [req.params.caseId]
  )
  res.json({ success: true, data: result.rows })
})

// ─── POST /evidence ───────────────────────────────────────────────────────────
router.post('/', requirePermission('evidence:create'), upload.single('file'), async (req, res) => {
  const { caseId, firId, type, title, description, locationFound, foundDate } = req.body

  const evidenceNumber = `EVD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

  let fileUrl: string | null = null
  let fileName: string | null = null
  let fileSize: number | null = null
  let fileMimeType: string | null = null

  if (req.file) {
    fileUrl = `/uploads/evidence/${req.file.filename}`
    fileName = req.file.originalname
    fileSize = req.file.size
    fileMimeType = req.file.mimetype
  }

  const result = await query(
    `INSERT INTO evidence
     (case_id, fir_id, evidence_number, type, title, description,
      location_found, found_date, collected_by, file_url, file_name,
      file_size, file_mime_type)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [caseId, firId || null, evidenceNumber, type, title, description || null,
     locationFound || null, foundDate || null, req.user!.userId,
     fileUrl, fileName, fileSize, fileMimeType]
  )

  await writeAuditLog({
    userId: req.user!.userId,
    action: 'CREATE_EVIDENCE',
    resourceType: 'evidence',
    resourceId: result.rows[0].id,
    ipAddress: req.ip,
    status: 'success',
  })

  res.status(201).json({ success: true, data: result.rows[0] })
})

// ─── PUT /evidence/:id ────────────────────────────────────────────────────────
router.put('/:id', requirePermission('evidence:update'), validate(UUIDSchema, 'params'), async (req, res) => {
  const { title, description, isForensicAnalyzed, forensicReport, courtSubmitted } = req.body

  const result = await query(
    `UPDATE evidence SET
       title = COALESCE($1, title),
       description = COALESCE($2, description),
       is_forensic_analyzed = COALESCE($3, is_forensic_analyzed),
       forensic_report = COALESCE($4, forensic_report),
       court_submitted = COALESCE($5, court_submitted),
       updated_at = NOW()
     WHERE id = $6 RETURNING *`,
    [title, description, isForensicAnalyzed, forensicReport, courtSubmitted, req.params.id]
  )

  if (result.rowCount === 0) throw new AppError('Evidence not found', 404, 'NOT_FOUND')
  res.json({ success: true, data: result.rows[0] })
})

// ─── DELETE /evidence/:id ─────────────────────────────────────────────────────
router.delete('/:id', requirePermission('evidence:delete'), validate(UUIDSchema, 'params'), async (req, res) => {
  const evidence = await query('SELECT file_url FROM evidence WHERE id = $1', [req.params.id])
  if (evidence.rowCount === 0) throw new AppError('Evidence not found', 404, 'NOT_FOUND')

  // Delete file if exists
  const fileUrl = (evidence.rows[0] as { file_url?: string }).file_url
  if (fileUrl) {
    const filePath = path.join(process.cwd(), fileUrl)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  }

  await query('DELETE FROM evidence WHERE id = $1', [req.params.id])
  res.json({ success: true, message: 'Evidence deleted' })
})

export default router
