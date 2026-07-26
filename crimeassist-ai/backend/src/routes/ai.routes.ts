import { Router } from 'express'
import { z } from 'zod'
import { authenticate } from '../middleware/auth.middleware'
import { requirePermission } from '../middleware/rbac.middleware'
import { rateLimitAI, rateLimitGeneral } from '../middleware/rateLimit.middleware'
import { validate } from '../middleware/validation.middleware'
import { query } from '../services/database.service'
import { AppError } from '../middleware/error.middleware'
import { writeAuditLog } from '../middleware/audit.middleware'
import { aiService } from '../services/ai.service'
import { io } from '../server'
import { logger } from '../utils/logger'

const router = Router()
router.use(authenticate)

// ─── Schemas ─────────────────────────────────────────────────────────────────
const ChatSchema = z.object({
  message: z.string().min(1).max(5000),
  sessionId: z.string().uuid().optional(),
  useRAG: z.boolean().default(true),
})

const SearchSchema = z.object({
  query: z.string().min(2).max(500),
  sourceType: z.enum(['fir', 'case', 'criminal', 'document']).optional(),
  limit: z.number().int().min(1).max(20).default(10),
})

const SummarizeSchema = z.object({
  caseId: z.string().uuid(),
})

// ─── POST /ai/chat ────────────────────────────────────────────────────────────
router.post('/chat', requirePermission('ai:chat'), rateLimitAI, validate(ChatSchema), async (req, res) => {
  const { message, sessionId, useRAG } = req.body
  const userId = req.user!.userId

  // Get or create chat session
  let activeSessionId = sessionId
  if (!activeSessionId) {
    const session = await query(
      `INSERT INTO chat_sessions (user_id, title) VALUES ($1, $2) RETURNING id`,
      [userId, message.substring(0, 50) + (message.length > 50 ? '...' : '')]
    )
    activeSessionId = session.rows[0].id
  }

  // Get session history (last 10 messages for context)
  const historyResult = await query(
    `SELECT role, content FROM chat_messages
     WHERE session_id = $1 ORDER BY created_at DESC LIMIT 10`,
    [activeSessionId]
  )
  const history = historyResult.rows.reverse()

  // Save user message
  await query(
    `INSERT INTO chat_messages (session_id, role, content) VALUES ($1, 'user', $2)`,
    [activeSessionId, message]
  )

  // Build message array
  const messages = [
    ...history.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: message },
  ]

  try {
    const response = await aiService.chat(messages, activeSessionId, useRAG)

    // Save assistant response
    await query(
      `INSERT INTO chat_messages
       (session_id, role, content, tokens_used, model, sources, processing_time_ms)
       VALUES ($1, 'assistant', $2, $3, $4, $5, $6)`,
      [activeSessionId, response.content, response.tokensUsed, response.model,
       JSON.stringify(response.sources), response.processingTimeMs]
    )

    res.json({
      success: true,
      data: {
        sessionId: activeSessionId,
        message: response.content,
        sources: response.sources,
        tokensUsed: response.tokensUsed,
        processingTimeMs: response.processingTimeMs,
        model: response.model,
      },
    })
  } catch (error) {
    logger.error('AI chat failed:', error)
    throw new AppError('AI service temporarily unavailable', 503, 'AI_UNAVAILABLE')
  }
})

// ─── POST /ai/chat/stream ─────────────────────────────────────────────────────
// Server-Sent Events streaming endpoint
router.post('/chat/stream', requirePermission('ai:chat'), rateLimitAI, validate(ChatSchema), async (req, res) => {
  const { message, sessionId, useRAG } = req.body
  const userId = req.user!.userId

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  let activeSessionId = sessionId
  if (!activeSessionId) {
    const session = await query(
      `INSERT INTO chat_sessions (user_id, title) VALUES ($1, $2) RETURNING id`,
      [userId, message.substring(0, 50)]
    )
    activeSessionId = session.rows[0].id
    res.write(`data: ${JSON.stringify({ type: 'session', sessionId: activeSessionId })}\n\n`)
  }

  const historyResult = await query(
    `SELECT role, content FROM chat_messages WHERE session_id = $1 ORDER BY created_at DESC LIMIT 10`,
    [activeSessionId]
  )
  const history = historyResult.rows.reverse()

  await query(
    `INSERT INTO chat_messages (session_id, role, content) VALUES ($1, 'user', $2)`,
    [activeSessionId, message]
  )

  const messages = [
    ...history.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: message },
  ]

  let fullContent = ''

  try {
    await aiService.chatStream(
      messages,
      (chunk) => {
        fullContent += chunk
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`)
      },
      async ({ tokensUsed, sources }) => {
        await query(
          `INSERT INTO chat_messages (session_id, role, content, sources)
           VALUES ($1, 'assistant', $2, $3)`,
          [activeSessionId, fullContent, JSON.stringify(sources)]
        )
        res.write(`data: ${JSON.stringify({ type: 'done', sources, tokensUsed })}\n\n`)
        res.end()
      }
    )
  } catch (error) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'AI service error' })}\n\n`)
    res.end()
  }
})

// ─── POST /ai/summarize ───────────────────────────────────────────────────────
router.post('/summarize', requirePermission('ai:summarize'), rateLimitAI, validate(SummarizeSchema), async (req, res) => {
  const { caseId } = req.body

  const summary = await aiService.generateCaseSummary(caseId)

  await writeAuditLog({
    userId: req.user!.userId,
    action: 'AI_SUMMARIZE_CASE',
    resourceType: 'ai',
    resourceId: caseId,
    ipAddress: req.ip,
    status: 'success',
  })

  res.json({ success: true, data: { summary, caseId } })
})

// ─── POST /ai/search ──────────────────────────────────────────────────────────
router.post('/search', requirePermission('ai:search'), rateLimitAI, validate(SearchSchema), async (req, res) => {
  const { query: queryText, sourceType, limit } = req.body

  const results = await aiService.semanticSearch(queryText, { sourceType, limit })

  // Enrich results with actual record data
  const enriched = await Promise.all(
    results.map(async (r) => {
      let record = null
      try {
        if (r.source === 'fir') {
          const res2 = await query('SELECT fir_number, complainant_name, crime_category, status, incident_date FROM fir WHERE id = $1', [r.sourceId])
          record = res2.rows[0]
        } else if (r.source === 'case') {
          const res2 = await query('SELECT case_number, title, crime_category, status FROM cases WHERE id = $1', [r.sourceId])
          record = res2.rows[0]
        } else if (r.source === 'criminal') {
          const res2 = await query('SELECT criminal_id, full_name, risk_level, is_wanted FROM criminals WHERE id = $1', [r.sourceId])
          record = res2.rows[0]
        }
      } catch {}
      return { ...r, record }
    })
  )

  res.json({
    success: true,
    data: {
      query: queryText,
      results: enriched,
      count: enriched.length,
    },
  })
})

// ─── GET /ai/sessions ─────────────────────────────────────────────────────────
router.get('/sessions', requirePermission('ai:chat'), rateLimitGeneral, async (req, res) => {
  const result = await query(
    `SELECT id, title, message_count, total_tokens, is_archived, created_at, updated_at
     FROM chat_sessions
     WHERE user_id = $1 AND is_archived = FALSE
     ORDER BY updated_at DESC LIMIT 50`,
    [req.user!.userId]
  )
  res.json({ success: true, data: result.rows })
})

// ─── GET /ai/sessions/:id/messages ───────────────────────────────────────────
router.get('/sessions/:id/messages', requirePermission('ai:chat'), rateLimitGeneral, async (req, res) => {
  const result = await query(
    `SELECT id, role, content, sources, feedback, processing_time_ms, created_at
     FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC`,
    [req.params.id]
  )
  res.json({ success: true, data: result.rows })
})

// ─── DELETE /ai/sessions/:id ──────────────────────────────────────────────────
router.delete('/sessions/:id', requirePermission('ai:chat'), async (req, res) => {
  await query(
    'UPDATE chat_sessions SET is_archived = TRUE WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user!.userId]
  )
  res.json({ success: true, message: 'Session archived' })
})

// ─── POST /ai/detect-duplicate ────────────────────────────────────────────────
router.post('/detect-duplicate', requirePermission('fir:read'), rateLimitAI, async (req, res) => {
  const { firId } = req.body
  const result = await aiService.detectDuplicateFIR(firId)
  res.json({ success: true, data: result })
})

// ─── POST /ai/risk-score ──────────────────────────────────────────────────────
router.post('/risk-score', requirePermission('criminals:read'), rateLimitAI, async (req, res) => {
  const { criminalId } = req.body
  const score = await aiService.calculateRiskScore(criminalId)
  res.json({ success: true, data: { criminalId, riskScore: score } })
})

// ─── PATCH /ai/messages/:id/feedback ─────────────────────────────────────────
router.patch('/messages/:id/feedback', requirePermission('ai:chat'), async (req, res) => {
  const { feedback, note } = req.body
  await query(
    'UPDATE chat_messages SET feedback = $1, feedback_note = $2 WHERE id = $3',
    [feedback, note || null, req.params.id]
  )
  res.json({ success: true })
})

export default router
