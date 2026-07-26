import OpenAI from 'openai'
import { query, globalVectorSearch, withTransaction } from './database.service'
import { logger } from '../utils/logger'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o'
const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small'
const MAX_TOKENS = parseInt(process.env.OPENAI_MAX_TOKENS || '4096')
const TEMPERATURE = parseFloat(process.env.OPENAI_TEMPERATURE || '0.2')

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
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text.substring(0, 8000), // Token limit
    })
    return response.data[0].embedding
  } catch (error) {
    logger.error('Embedding generation failed:', error)
    throw error
  }
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
    // Remove old embeddings for this document
    await client.query(
      'DELETE FROM document_embeddings WHERE source_type = $1 AND source_id = $2',
      [sourceType, sourceId]
    )

    for (let i = 0; i < chunks.length; i++) {
      const embedding = await generateEmbedding(chunks[i])
      const vectorStr = `[${embedding.join(',')}]`
      await client.query(
        `INSERT INTO document_embeddings (source_type, source_id, chunk_index, chunk_text, embedding, metadata)
         VALUES ($1, $2, $3, $4, $5::vector, $6)
         ON CONFLICT (source_type, source_id, chunk_index) DO UPDATE SET
           chunk_text = EXCLUDED.chunk_text,
           embedding = EXCLUDED.embedding,
           metadata = EXCLUDED.metadata`,
        [sourceType, sourceId, i, chunks[i], vectorStr, JSON.stringify(metadata)]
      )
    }
  })

  logger.debug(`Indexed ${chunks.length} chunks for ${sourceType}:${sourceId}`)
}

// ─── RAG Context Retrieval ────────────────────────────────────────────────────
async function retrieveContext(
  userQuery: string,
  limit: number = 8,
  threshold: number = 0.6
): Promise<Array<{ text: string; source: string; sourceId: string; similarity: number }>> {
  const queryEmbedding = await generateEmbedding(userQuery)
  const results = await globalVectorSearch(queryEmbedding, limit, threshold)

  return results.map((r) => ({
    text: r.chunk_text,
    source: r.source_type,
    sourceId: r.source_id,
    similarity: r.similarity,
    metadata: r.metadata,
  }))
}

// ─── Build RAG Prompt ─────────────────────────────────────────────────────────
function buildRAGPrompt(
  userQuery: string,
  contexts: Array<{ text: string; source: string; sourceId: string; similarity: number }>
): string {
  if (contexts.length === 0) {
    return userQuery
  }

  const contextText = contexts
    .map((c, i) => `[Context ${i + 1} | Source: ${c.source} | Relevance: ${(c.similarity * 100).toFixed(0)}%]\n${c.text}`)
    .join('\n\n')

  return `Based on the following retrieved information from the KSP database, answer the question.

RETRIEVED CONTEXT:
${contextText}

USER QUESTION: ${userQuery}

Please provide a comprehensive answer based on the context. If the context doesn't fully address the question, supplement with your general knowledge about Indian police procedures and criminal law.`
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
  let augmentedMessages = [...messages]

  // RAG: retrieve relevant context
  if (useRAG && lastUserMessage) {
    try {
      const contexts = await retrieveContext(lastUserMessage.content)
      sources = contexts.map((c) => ({
        source: c.source,
        sourceId: c.sourceId,
        similarity: c.similarity,
      }))

      if (contexts.length > 0) {
        // Replace the last user message with RAG-augmented version
        augmentedMessages = [
          ...messages.slice(0, -1),
          { role: 'user', content: buildRAGPrompt(lastUserMessage.content, contexts) },
        ]
      }
    } catch (err) {
      logger.warn('RAG retrieval failed, falling back to direct response:', err)
    }
  }

  // Build message array for OpenAI
  const openAIMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: KSP_SYSTEM_PROMPT },
    ...augmentedMessages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ]

  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: openAIMessages,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    stream: false,
  })

  const content = completion.choices[0]?.message?.content || 'Unable to generate response'
  const tokensUsed = completion.usage?.total_tokens || 0
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
  let augmentedMessages = [...messages]
  let sources: Array<{ source: string; sourceId: string; similarity: number }> = []

  // RAG retrieval
  if (lastUserMessage) {
    try {
      const contexts = await retrieveContext(lastUserMessage.content, 6)
      sources = contexts.map((c) => ({ source: c.source, sourceId: c.sourceId, similarity: c.similarity }))
      if (contexts.length > 0) {
        augmentedMessages = [
          ...messages.slice(0, -1),
          { role: 'user', content: buildRAGPrompt(lastUserMessage.content, contexts) },
        ]
      }
    } catch {}
  }

  const openAIMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: KSP_SYSTEM_PROMPT },
    ...augmentedMessages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ]

  const stream = await openai.chat.completions.create({
    model: MODEL,
    messages: openAIMessages,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    stream: true,
  })

  let totalContent = ''
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || ''
    if (delta) {
      totalContent += delta
      onChunk(delta)
    }
  }

  onDone({ tokensUsed: 0, sources })
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
    IPC Sections: ${(c.ipc_sections || []).join(', ')}
    Suspects: ${suspects.rows.length} (${suspects.rows.map((s: { full_name: string }) => s.full_name).join(', ')})
    Victims: ${victims.rows.length}
    Recent Notes: ${notes.rows.map((n: { note_type: string; content: string }) => `[${n.note_type}] ${n.content}`).join('\n')}
  `

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: KSP_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Please provide a professional 3-paragraph case summary for the following case data. Include: 1) Case overview and current status, 2) Key suspects and victims, 3) Investigation progress and recommendations.\n\n${caseText}`,
      },
    ],
    max_tokens: 1000,
    temperature: 0.3,
  })

  const summary = response.choices[0]?.message?.content || ''

  // Save summary to database
  await query('UPDATE cases SET ai_summary = $1, updated_at = NOW() WHERE id = $2', [summary, caseId])

  // Index for RAG
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

  // Risk scoring algorithm
  let score = 0
  score += Math.min(cr.total_cases || 0, 10) * 3           // Max 30 pts for case count
  score += Math.min(cr.active_cases_count || 0, 5) * 5      // Max 25 pts for active cases
  score += Math.min(cr.total_convictions || 0, 5) * 4        // Max 20 pts for convictions
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
  const embedding = await generateEmbedding(`${f.crime_description} ${f.incident_location}`)
  const vectorStr = `[${embedding.join(',')}]`

  const similar = await query<{ id: string; fir_number: string; similarity: number }>(
    `SELECT id, fir_number, 1 - (embedding <=> $1::vector) AS similarity
     FROM fir
     WHERE id != $2
       AND ABS(EXTRACT(epoch FROM (incident_date - $3::timestamptz)) / 3600) < 72
       AND 1 - (embedding <=> $1::vector) > 0.92
     ORDER BY embedding <=> $1::vector
     LIMIT 1`,
    [vectorStr, firId, f.incident_date]
  )

  if (similar.rows.length > 0) {
    const match = similar.rows[0]
    await query(
      'UPDATE fir SET is_duplicate = TRUE, duplicate_fir_id = $1, duplicate_score = $2 WHERE id = $3',
      [match.id, match.similarity, firId]
    )
    return { isDuplicate: true, matchedFirId: match.id, score: match.similarity }
  }

  return { isDuplicate: false }
}

// ─── Natural Language Search ──────────────────────────────────────────────────
export async function semanticSearch(
  query_text: string,
  filters: { sourceType?: string; limit?: number } = {}
): Promise<Array<{ source: string; sourceId: string; text: string; similarity: number; metadata: Record<string, unknown> }>> {
  const embedding = await generateEmbedding(query_text)
  const results = await globalVectorSearch(embedding, filters.limit || 10, 0.55)

  return results
    .filter((r) => !filters.sourceType || r.source_type === filters.sourceType)
    .map((r) => ({
      source: r.source_type,
      sourceId: r.source_id,
      text: r.chunk_text,
      similarity: r.similarity,
      metadata: r.metadata,
    }))
}

// ─── Generate Case Summary (Background) ──────────────────────────────────────
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
