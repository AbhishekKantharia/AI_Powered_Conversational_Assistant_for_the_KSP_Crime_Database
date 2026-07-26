import Anthropic from '@anthropic-ai/sdk'
import { query, globalVectorSearch, withTransaction } from './database.service'
import { logger } from '../utils/logger'
import { fetchIPCSections, fetchKarnatakaCrimeStats, searchIPCSections } from './publicData.service'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514'
const MAX_TOKENS = parseInt(process.env.ANTHROPIC_MAX_TOKENS || '4096')
const TEMPERATURE = parseFloat(process.env.ANTHROPIC_TEMPERATURE || '0.2')

// ─── KSP System Prompt ───────────────────────────────────────────────────────
const KSP_SYSTEM_PROMPT = `You are CrimeAssist AI, an expert crime investigation assistant for the Karnataka State Police (KSP). You have deep knowledge of:

1. Indian Penal Code (IPC) sections and their applications
2. Code of Criminal Procedure (CrPC) 
3. Karnataka State Police procedures and protocols
4. Crime investigation methodologies
5. Forensic evidence analysis
6. Criminal profiling techniques
7. KSP district jurisdictions and police station codes
8. Legal procedures for FIR filing, chargesheet, and court proceedings

When answering questions:
- Be precise, professional, and factual
- Cite IPC sections when relevant
- Provide actionable investigation insights
- Flag potential duplicate FIRs or connected cases
- Assess risk levels for criminals
- Never reveal sensitive personal information unnecessarily
- Always maintain confidentiality of sensitive case details
- Format responses with clear structure using markdown when appropriate
- For crime analytics, provide statistical insights and trend analysis

Current date: ${new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
Database: Karnataka State Police Crime Database`

// ─── Embedding Generation ─────────────────────────────────────────────────────
// Anthropic does not provide an embedding API. We use keyword-based search as fallback.
export async function generateEmbedding(_text: string): Promise<number[]> {
  logger.warn('Embedding generation requested but Anthropic does not support embeddings. Returning empty vector.')
  return []
}

// ─── Document Chunking ────────────────────────────────────────────────────────
function chunkText(text: string, chunkSize: number = 500, overlap: number = 50): string[] {
  const words = text.split(/\s+/)
  const chunks: string[] = []

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(' ')
    if (chunk.trim()) chunks.push(chunk)
  }

  return chunks
}

// ─── Index Document for RAG ───────────────────────────────────────────────────
export async function indexDocument(
  sourceType: string,
  sourceId: string,
  text: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const chunks = chunkText(text)

  await withTransaction(async (client) => {
    await client.query(
      'DELETE FROM document_embeddings WHERE source_type = $1 AND source_id = $2',
      [sourceType, sourceId]
    )

    for (let i = 0; i < chunks.length; i++) {
      await client.query(
        `INSERT INTO document_embeddings (source_type, source_id, chunk_index, chunk_text, embedding, metadata)
         VALUES ($1, $2, $3, $4, $5::vector, $6)
         ON CONFLICT (source_type, source_id, chunk_index) DO UPDATE SET
           chunk_text = EXCLUDED.chunk_text,
           metadata = EXCLUDED.metadata`,
        [sourceType, sourceId, i, chunks[i], '[]', JSON.stringify(metadata)]
      )
    }
  })

  logger.debug(`Indexed ${chunks.length} chunks for ${sourceType}:${sourceId}`)
}

// ─── RAG Context Retrieval ────────────────────────────────────────────────────
async function retrieveContext(
  userQuery: string,
  _limit: number = 8,
  _threshold: number = 0.6
): Promise<Array<{ text: string; source: string; sourceId: string; similarity: number }>> {
  // Try vector search first, fall back to keyword search
  try {
    const queryEmbedding = await generateEmbedding(userQuery)
    if (queryEmbedding.length > 0) {
      const results = await globalVectorSearch(queryEmbedding, _limit, _threshold)
      return results.map((r) => ({
        text: r.chunk_text,
        source: r.source_type,
        sourceId: r.source_id,
        similarity: r.similarity,
        metadata: r.metadata,
      }))
    }
  } catch {}

  // Keyword-based fallback search
  try {
    const keywords = userQuery.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
    if (keywords.length === 0) return []

    const conditions = keywords.map((_, i) => `chunk_text ILIKE $${i + 1}`)
    const params = keywords.map((k) => `%${k}%`)

    const result = await query<{
      chunk_text: string
      source_type: string
      source_id: string
    }>(
      `SELECT chunk_text, source_type, source_id
       FROM document_embeddings
       WHERE ${conditions.join(' OR ')}
       LIMIT $${params.length + 1}`,
      [...params, _limit]
    )

    return result.rows.map((r, idx) => ({
      text: r.chunk_text,
      source: r.source_type,
      sourceId: r.source_id,
      similarity: 0.7 - idx * 0.05,
    }))
  } catch (err) {
    logger.warn('Keyword search fallback failed:', err)
    return []
  }
}

// ─── Build RAG Prompt ─────────────────────────────────────────────────────────
async function buildRAGPrompt(
  userQuery: string,
  contexts: Array<{ text: string; source: string; sourceId: string; similarity: number }>
): Promise<string> {
  let ipcContext = ''
  try {
    const ipcResults = await searchIPCSections(userQuery)
    if (ipcResults.length > 0) {
      ipcContext = '\n\nRELEVANT IPC SECTIONS (from Indian Penal Code):\n' +
        ipcResults.slice(0, 5).map((s) =>
          `Section ${s.section}: ${s.title}\n${s.description}\nPunishment: ${s.punishment || 'N/A'}`
        ).join('\n\n')
    }
  } catch {}

  let ncrbContext = ''
  try {
    const stats = await fetchKarnatakaCrimeStats()
    if (stats.length > 0) {
      const totalCrime = stats.reduce((sum, d) => sum + d.totalCrime, 0)
      const top5 = [...stats].sort((a, b) => b.totalCrime - a.totalCrime).slice(0, 5)
      ncrbContext = `\n\nNCRB KARNATAKA CRIME STATISTICS:\nTotal reported crimes in Karnataka: ${totalCrime.toLocaleString()}\nTop 5 districts by crime volume:\n${top5.map((d) => `${d.district}: ${d.totalCrime.toLocaleString()}`).join('\n')}`
    }
  } catch {}

  if (contexts.length === 0 && !ipcContext) {
    return userQuery
  }

  const contextText = contexts
    .map((c, i) => `[Context ${i + 1} | Source: ${c.source} | Relevance: ${(c.similarity * 100).toFixed(0)}%]\n${c.text}`)
    .join('\n\n')

  let prompt = ''
  if (contextText) {
    prompt += `RETRIEVED CONTEXT:\n${contextText}\n\n`
  }
  if (ipcContext) {
    prompt += ipcContext
  }
  if (ncrbContext) {
    prompt += ncrbContext
  }
  prompt += `\nUSER QUESTION: ${userQuery}`
  prompt += `\n\nPlease provide a comprehensive answer based on the context, relevant IPC sections, and NCRB statistics. If the context doesn't fully address the question, supplement with your general knowledge about Indian police procedures and criminal law.`

  return prompt
}

// ─── Main Chat Function ───────────────────────────────────────────────────────
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatResponse {
  content: string
  sources: Array<{ source: string; sourceId: string; similarity: number }>
  tokensUsed: number
  processingTimeMs: number
  model: string
}

export async function chat(
  messages: ChatMessage[],
  sessionId: string,
  useRAG: boolean = true
): Promise<ChatResponse> {
  const startTime = Date.now()
  const lastUserMessage = messages.filter((m) => m.role === 'user').slice(-1)[0]

  let sources: Array<{ source: string; sourceId: string; similarity: number }> = []
  let augmentedQuery = lastUserMessage?.content || ''

  if (useRAG && lastUserMessage) {
    try {
      const contexts = await retrieveContext(lastUserMessage.content)
      sources = contexts.map((c) => ({
        source: c.source,
        sourceId: cSourceId,
        similarity: c.similarity,
      }))

      if (contexts.length > 0) {
        augmentedQuery = await buildRAGPrompt(lastUserMessage.content, contexts)
      }
    } catch (err) {
      logger.warn('RAG retrieval failed, falling back to direct response:', err)
    }
  }

  // Build Anthropic messages (system prompt is separate)
  const anthropicMessages: Anthropic.MessageParam[] = [
    ...messages.slice(0, -1).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: augmentedQuery },
  ]

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    system: KSP_SYSTEM_PROMPT,
    messages: anthropicMessages,
  })

  const content = response.content[0]?.type === 'text' ? response.content[0].text : 'Unable to generate response'
  const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)
  const processingTimeMs = Date.now() - startTime

  return { content, sources, tokensUsed, processingTimeMs, model: MODEL }
}

// ─── Streaming Chat ───────────────────────────────────────────────────────────
export async function chatStream(
  messages: ChatMessage[],
  onChunk: (chunk: string) => void,
  onDone: (usage: { tokensUsed: number; sources: Array<{ source: string; sourceId: string }> }) => void
): Promise<void> {
  const lastUserMessage = messages.filter((m) => m.role === 'user').slice(-1)[0]
  let augmentedQuery = lastUserMessage?.content || ''
  let sources: Array<{ source: string; sourceId: string; similarity: number }> = []

  if (lastUserMessage) {
    try {
      const contexts = await retrieveContext(lastUserMessage.content, 6)
      sources = contexts.map((c) => ({ source: c.source, sourceId: c.sourceId, similarity: c.similarity }))
      if (contexts.length > 0) {
        augmentedQuery = await buildRAGPrompt(lastUserMessage.content, contexts)
      }
    } catch {}
  }

  const anthropicMessages: Anthropic.MessageParam[] = [
    ...messages.slice(0, -1).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: augmentedQuery },
  ]

  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    system: KSP_SYSTEM_PROMPT,
    messages: anthropicMessages,
  })

  let totalContent = ''
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      totalContent += event.delta.text
      onChunk(event.delta.text)
    }
  }

  const finalMessage = await stream.finalMessage()
  const tokensUsed = (finalMessage.usage?.input_tokens || 0) + (finalMessage.usage?.output_tokens || 0)
  onDone({ tokensUsed, sources })
}

// ─── Case Summarization ───────────────────────────────────────────────────────
export async function summarizeCase(caseId: string): Promise<string> {
  const [caseData, suspects, victims, notes] = await Promise.all([
    query(`SELECT c.*, d.name AS district, ps.name AS station
           FROM cases c
           LEFT JOIN districts d ON d.id = c.district_id
           LEFT JOIN police_stations ps ON ps.id = c.station_id
           WHERE c.id = $1`, [caseId]),
    query('SELECT * FROM suspects WHERE case_id = $1', [caseId]),
    query('SELECT * FROM victims WHERE case_id = $1', [caseId]),
    query('SELECT content, note_type FROM case_notes WHERE case_id = $1 ORDER BY created_at DESC LIMIT 5', [caseId]),
  ])

  if (caseData.rowCount === 0) throw new Error('Case not found')
  const c = caseData.rows[0]

  const caseText = `
    Case Number: ${c.case_number}
    Title: ${c.title}
    Crime Category: ${c.crime_category}
    Status: ${c.status}
    Priority: ${c.priority}
    District: ${c.district}
    Station: ${c.station}
    Description: ${c.description}
    IPC Sections: ${(c.ipc_sections as string[] || []).join(', ')}
    Suspects: ${suspects.rows.length} (${suspects.rows.map((s) => (s as { full_name: string }).full_name).join(', ')})
    Victims: ${victims.rows.length}
    Recent Notes: ${notes.rows.map((n) => { const nn = n as { note_type: string; content: string }; return `[${nn.note_type}] ${nn.content}` }).join('\n')}
  `

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1000,
    temperature: 0.3,
    system: KSP_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Please provide a professional 3-paragraph case summary for the following case data. Include: 1) Case overview and current status, 2) Key suspects and victims, 3) Investigation progress and recommendations.\n\n${caseText}`,
      },
    ],
  })

  const summary = response.content[0]?.type === 'text' ? response.content[0].text : ''

  await query('UPDATE cases SET ai_summary = $1, updated_at = NOW() WHERE id = $2', [summary, caseId])

  await indexDocument('case', caseId, `${c.title}\n${c.description}\n${summary}`, {
    caseNumber: c.case_number,
    category: c.crime_category,
    status: c.status,
  })

  return summary
}

// ─── Criminal Risk Score ──────────────────────────────────────────────────────
export async function calculateRiskScore(criminalId: string): Promise<number> {
  const result = await query(
    `SELECT cr.*, COUNT(s.id) AS total_suspects,
            COUNT(CASE WHEN c.status NOT IN ('closed','archived') THEN 1 END) AS active_cases_count,
            COUNT(CASE WHEN s.is_convicted THEN 1 END) AS convictions
     FROM criminals cr
     LEFT JOIN suspects s ON s.criminal_id = cr.id
     LEFT JOIN cases c ON c.id = s.case_id
     WHERE cr.id = $1
     GROUP BY cr.id`,
    [criminalId]
  )

  if (result.rowCount === 0) throw new Error('Criminal not found')
  const cr = result.rows[0] as {
    total_cases: number; active_cases_count: number; total_convictions: number
    is_wanted: boolean; is_absconding: boolean; crime_specialization: string[]
  }

  let score = 0
  score += Math.min(cr.total_cases || 0, 10) * 3
  score += Math.min(cr.active_cases_count || 0, 5) * 5
  score += Math.min(cr.total_convictions || 0, 5) * 4
  if (cr.is_wanted) score += 15
  if (cr.is_absconding) score += 10
  const dangerousCategories = ['murder', 'terrorism', 'kidnapping', 'sexual_offense', 'arms_offense']
  const hasDangerous = (cr.crime_specialization || []).some((c: string) => dangerousCategories.includes(c))
  if (hasDangerous) score += 20

  const finalScore = Math.min(100, Math.max(0, score))

  await query('UPDATE criminals SET risk_score = $1, updated_at = NOW() WHERE id = $2', [finalScore, criminalId])

  return finalScore
}

// ─── Duplicate FIR Detection ──────────────────────────────────────────────────
export async function detectDuplicateFIR(firId: string): Promise<{ isDuplicate: boolean; matchedFirId?: string; score?: number }> {
  const fir = await query('SELECT fir_number, crime_description, incident_location, incident_date FROM fir WHERE id = $1', [firId])
  if (fir.rowCount === 0) return { isDuplicate: false }

  const f = fir.rows[0] as { fir_number: string; crime_description: string; incident_location: string; incident_date: string }

  // Use keyword-based search for duplicate detection
  const keywords = `${f.crime_description} ${f.incident_location}`.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
  if (keywords.length === 0) return { isDuplicate: false }

  try {
    const conditions = keywords.map((_, i) => `crime_description ILIKE $${i + 1} OR incident_location ILIKE $${i + 1}`)
    const params = keywords.map((k) => `%${k}%`)

    const similar = await query<{ id: string; fir_number: string }>(
      `SELECT id, fir_number
       FROM fir
       WHERE id != $1
         AND ABS(EXTRACT(epoch FROM (incident_date - $2::timestamptz)) / 3600) < 72
         AND (${conditions.join(' OR ')})
       LIMIT 1`,
      [firId, f.incident_date, ...params]
    )

    if (similar.rows.length > 0) {
      const match = similar.rows[0]
      await query(
        'UPDATE fir SET is_duplicate = TRUE, duplicate_fir_id = $1, duplicate_score = $2 WHERE id = $3',
        [match.id, 0.85, firId]
      )
      return { isDuplicate: true, matchedFirId: match.id, score: 0.85 }
    }
  } catch (err) {
    logger.warn('Duplicate detection search failed:', err)
  }

  return { isDuplicate: false }
}

// ─── Natural Language Search ──────────────────────────────────────────────────
export async function semanticSearch(
  query_text: string,
  filters: { sourceType?: string; limit?: number } = {}
): Promise<Array<{ source: string; sourceId: string; text: string; similarity: number; metadata: Record<string, unknown> }>> {
  const keywords = query_text.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
  if (keywords.length === 0) return []

  try {
    const conditions = keywords.map((_, i) => `chunk_text ILIKE $${i + 1}`)
    const params = keywords.map((k) => `%${k}%`)

    let sql = `SELECT chunk_text, source_type, source_id, '{}'::jsonb AS metadata
               FROM document_embeddings
               WHERE ${conditions.join(' OR ')}`

    if (filters.sourceType) {
      sql += ` AND source_type = $${params.length + 1}`
      params.push(filters.sourceType)
    }

    sql += ` LIMIT $${params.length + 1}`
    params.push(filters.limit || 10)

    const results = await query<{
      chunk_text: string; source_type: string; source_id: string; metadata: Record<string, unknown>
    }>(sql, params)

    return results.rows.map((r, idx) => ({
      source: r.source_type,
      sourceId: r.source_id,
      text: r.chunk_text,
      similarity: 0.7 - idx * 0.05,
      metadata: r.metadata,
    }))
  } catch (err) {
    logger.warn('Semantic search failed:', err)
    return []
  }
}

// ─── Export Service ──────────────────────────────────────────────────────────
export const aiService = {
  generateCaseSummary: summarizeCase,
  calculateRiskScore,
  detectDuplicateFIR,
  semanticSearch,
  chat,
  chatStream,
  generateEmbedding,
  indexDocument,
}

export default aiService
