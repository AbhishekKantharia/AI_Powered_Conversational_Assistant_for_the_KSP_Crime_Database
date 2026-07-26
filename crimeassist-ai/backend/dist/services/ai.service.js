"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = void 0;
exports.generateEmbedding = generateEmbedding;
exports.indexDocument = indexDocument;
exports.chat = chat;
exports.chatStream = chatStream;
exports.summarizeCase = summarizeCase;
exports.calculateRiskScore = calculateRiskScore;
exports.detectDuplicateFIR = detectDuplicateFIR;
exports.semanticSearch = semanticSearch;
const openai_1 = __importDefault(require("openai"));
const database_service_1 = require("./database.service");
const logger_1 = require("../utils/logger");
const publicData_service_1 = require("./publicData.service");
const openai = new openai_1.default({
    apiKey: process.env.GROQ_API_KEY || process.env.ANTHROPIC_API_KEY,
    baseURL: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
});
const MODEL = process.env.LLM_MODEL || 'llama-3.3-70b-versatile';
const MAX_TOKENS = parseInt(process.env.LLM_MAX_TOKENS || '4096');
const TEMPERATURE = parseFloat(process.env.LLM_TEMPERATURE || '0.2');
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
Database: Karnataka State Police Crime Database`;
// ─── Embedding Generation ─────────────────────────────────────────────────────
async function generateEmbedding(_text) {
    logger_1.logger.warn('Embedding generation requested but Groq does not support embeddings. Returning empty vector.');
    return [];
}
// ─── Document Chunking ────────────────────────────────────────────────────────
function chunkText(text, chunkSize = 500, overlap = 50) {
    const words = text.split(/\s+/);
    const chunks = [];
    for (let i = 0; i < words.length; i += chunkSize - overlap) {
        const chunk = words.slice(i, i + chunkSize).join(' ');
        if (chunk.trim())
            chunks.push(chunk);
    }
    return chunks;
}
// ─── Index Document for RAG ───────────────────────────────────────────────────
async function indexDocument(sourceType, sourceId, text, metadata = {}) {
    const chunks = chunkText(text);
    await (0, database_service_1.withTransaction)(async (client) => {
        await client.query('DELETE FROM document_embeddings WHERE source_type = $1 AND source_id = $2', [sourceType, sourceId]);
        for (let i = 0; i < chunks.length; i++) {
            await client.query(`INSERT INTO document_embeddings (source_type, source_id, chunk_index, chunk_text, embedding, metadata)
         VALUES ($1, $2, $3, $4, $5::vector, $6)
         ON CONFLICT (source_type, source_id, chunk_index) DO UPDATE SET
           chunk_text = EXCLUDED.chunk_text,
           metadata = EXCLUDED.metadata`, [sourceType, sourceId, i, chunks[i], '[]', JSON.stringify(metadata)]);
        }
    });
    logger_1.logger.debug(`Indexed ${chunks.length} chunks for ${sourceType}:${sourceId}`);
}
// ─── RAG Context Retrieval ────────────────────────────────────────────────────
async function retrieveContext(userQuery, _limit = 8, _threshold = 0.6) {
    try {
        const queryEmbedding = await generateEmbedding(userQuery);
        if (queryEmbedding.length > 0) {
            const results = await (0, database_service_1.globalVectorSearch)(queryEmbedding, _limit, _threshold);
            return results.map((r) => ({
                text: r.chunk_text,
                source: r.source_type,
                sourceId: r.source_id,
                similarity: r.similarity,
                metadata: r.metadata,
            }));
        }
    }
    catch { }
    try {
        const keywords = userQuery.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
        if (keywords.length === 0)
            return [];
        const conditions = keywords.map((_, i) => `chunk_text ILIKE $${i + 1}`);
        const params = keywords.map((k) => `%${k}%`);
        const result = await (0, database_service_1.query)(`SELECT chunk_text, source_type, source_id
       FROM document_embeddings
       WHERE ${conditions.join(' OR ')}
       LIMIT $${params.length + 1}`, [...params, _limit]);
        return result.rows.map((r, idx) => ({
            text: r.chunk_text,
            source: r.source_type,
            sourceId: r.source_id,
            similarity: 0.7 - idx * 0.05,
        }));
    }
    catch (err) {
        logger_1.logger.warn('Keyword search fallback failed:', err);
        return [];
    }
}
// ─── Build RAG Prompt ─────────────────────────────────────────────────────────
async function buildRAGPrompt(userQuery, contexts) {
    let ipcContext = '';
    try {
        const ipcResults = await (0, publicData_service_1.searchIPCSections)(userQuery);
        if (ipcResults.length > 0) {
            ipcContext = '\n\nRELEVANT IPC SECTIONS (from Indian Penal Code):\n' +
                ipcResults.slice(0, 5).map((s) => `Section ${s.section}: ${s.title}\n${s.description}\nPunishment: ${s.punishment || 'N/A'}`).join('\n\n');
        }
    }
    catch { }
    let ncrbContext = '';
    try {
        const stats = await (0, publicData_service_1.fetchKarnatakaCrimeStats)();
        if (stats.length > 0) {
            const totalCrime = stats.reduce((sum, d) => sum + d.totalCrime, 0);
            const top5 = [...stats].sort((a, b) => b.totalCrime - a.totalCrime).slice(0, 5);
            ncrbContext = `\n\nNCRB KARNATAKA CRIME STATISTICS:\nTotal reported crimes in Karnataka: ${totalCrime.toLocaleString()}\nTop 5 districts by crime volume:\n${top5.map((d) => `${d.district}: ${d.totalCrime.toLocaleString()}`).join('\n')}`;
        }
    }
    catch { }
    if (contexts.length === 0 && !ipcContext) {
        return userQuery;
    }
    const contextText = contexts
        .map((c, i) => `[Context ${i + 1} | Source: ${c.source} | Relevance: ${(c.similarity * 100).toFixed(0)}%]\n${c.text}`)
        .join('\n\n');
    let prompt = '';
    if (contextText) {
        prompt += `RETRIEVED CONTEXT:\n${contextText}\n\n`;
    }
    if (ipcContext) {
        prompt += ipcContext;
    }
    if (ncrbContext) {
        prompt += ncrbContext;
    }
    prompt += `\nUSER QUESTION: ${userQuery}`;
    prompt += `\n\nPlease provide a comprehensive answer based on the context, relevant IPC sections, and NCRB statistics. If the context doesn't fully address the question, supplement with your general knowledge about Indian police procedures and criminal law.`;
    return prompt;
}
async function chat(messages, sessionId, useRAG = true) {
    const startTime = Date.now();
    const lastUserMessage = messages.filter((m) => m.role === 'user').slice(-1)[0];
    let sources = [];
    let augmentedQuery = lastUserMessage?.content || '';
    if (useRAG && lastUserMessage) {
        try {
            const contexts = await retrieveContext(lastUserMessage.content);
            sources = contexts.map((c) => ({
                source: c.source,
                sourceId: c.sourceId,
                similarity: c.similarity,
            }));
            if (contexts.length > 0) {
                augmentedQuery = await buildRAGPrompt(lastUserMessage.content, contexts);
            }
        }
        catch (err) {
            logger_1.logger.warn('RAG retrieval failed, falling back to direct response:', err);
        }
    }
    const openaiMessages = [
        { role: 'system', content: KSP_SYSTEM_PROMPT },
        ...messages.slice(0, -1).map((m) => ({
            role: m.role,
            content: m.content,
        })),
        { role: 'user', content: augmentedQuery },
    ];
    const response = await openai.chat.completions.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        messages: openaiMessages,
    });
    const content = response.choices[0]?.message?.content || 'Unable to generate response';
    const tokensUsed = (response.usage?.prompt_tokens || 0) + (response.usage?.completion_tokens || 0);
    const processingTimeMs = Date.now() - startTime;
    return { content, sources, tokensUsed, processingTimeMs, model: MODEL };
}
// ─── Streaming Chat ───────────────────────────────────────────────────────────
async function chatStream(messages, onChunk, onDone) {
    const lastUserMessage = messages.filter((m) => m.role === 'user').slice(-1)[0];
    let augmentedQuery = lastUserMessage?.content || '';
    let sources = [];
    if (lastUserMessage) {
        try {
            const contexts = await retrieveContext(lastUserMessage.content, 6);
            sources = contexts.map((c) => ({ source: c.source, sourceId: c.sourceId, similarity: c.similarity }));
            if (contexts.length > 0) {
                augmentedQuery = await buildRAGPrompt(lastUserMessage.content, contexts);
            }
        }
        catch { }
    }
    const openaiMessages = [
        { role: 'system', content: KSP_SYSTEM_PROMPT },
        ...messages.slice(0, -1).map((m) => ({
            role: m.role,
            content: m.content,
        })),
        { role: 'user', content: augmentedQuery },
    ];
    const stream = await openai.chat.completions.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        messages: openaiMessages,
        stream: true,
    });
    let totalContent = '';
    let promptTokens = 0;
    let completionTokens = 0;
    for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
            totalContent += delta;
            onChunk(delta);
        }
        if (chunk.usage) {
            promptTokens = chunk.usage.prompt_tokens || 0;
            completionTokens = chunk.usage.completion_tokens || 0;
        }
    }
    const tokensUsed = promptTokens + completionTokens;
    onDone({ tokensUsed, sources });
}
// ─── Case Summarization ───────────────────────────────────────────────────────
async function summarizeCase(caseId) {
    const [caseData, suspects, victims, notes] = await Promise.all([
        (0, database_service_1.query)(`SELECT c.*, d.name AS district, ps.name AS station
           FROM cases c
           LEFT JOIN districts d ON d.id = c.district_id
           LEFT JOIN police_stations ps ON ps.id = c.station_id
           WHERE c.id = $1`, [caseId]),
        (0, database_service_1.query)('SELECT * FROM suspects WHERE case_id = $1', [caseId]),
        (0, database_service_1.query)('SELECT * FROM victims WHERE case_id = $1', [caseId]),
        (0, database_service_1.query)('SELECT content, note_type FROM case_notes WHERE case_id = $1 ORDER BY created_at DESC LIMIT 5', [caseId]),
    ]);
    if (caseData.rowCount === 0)
        throw new Error('Case not found');
    const c = caseData.rows[0];
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
    Suspects: ${suspects.rows.length} (${suspects.rows.map((s) => s.full_name).join(', ')})
    Victims: ${victims.rows.length}
    Recent Notes: ${notes.rows.map((n) => { const nn = n; return `[${nn.note_type}] ${nn.content}`; }).join('\n')}
  `;
    const response = await openai.chat.completions.create({
        model: MODEL,
        max_tokens: 1000,
        temperature: 0.3,
        messages: [
            { role: 'system', content: KSP_SYSTEM_PROMPT },
            {
                role: 'user',
                content: `Please provide a professional 3-paragraph case summary for the following case data. Include: 1) Case overview and current status, 2) Key suspects and victims, 3) Investigation progress and recommendations.\n\n${caseText}`,
            },
        ],
    });
    const summary = response.choices[0]?.message?.content || '';
    await (0, database_service_1.query)('UPDATE cases SET ai_summary = $1, updated_at = NOW() WHERE id = $2', [summary, caseId]);
    await indexDocument('case', caseId, `${c.title}\n${c.description}\n${summary}`, {
        caseNumber: c.case_number,
        category: c.crime_category,
        status: c.status,
    });
    return summary;
}
// ─── Criminal Risk Score ──────────────────────────────────────────────────────
async function calculateRiskScore(criminalId) {
    const result = await (0, database_service_1.query)(`SELECT cr.*, COUNT(s.id) AS total_suspects,
            COUNT(CASE WHEN c.status NOT IN ('closed','archived') THEN 1 END) AS active_cases_count,
            COUNT(CASE WHEN s.is_convicted THEN 1 END) AS convictions
     FROM criminals cr
     LEFT JOIN suspects s ON s.criminal_id = cr.id
     LEFT JOIN cases c ON c.id = s.case_id
     WHERE cr.id = $1
     GROUP BY cr.id`, [criminalId]);
    if (result.rowCount === 0)
        throw new Error('Criminal not found');
    const cr = result.rows[0];
    let score = 0;
    score += Math.min(cr.total_cases || 0, 10) * 3;
    score += Math.min(cr.active_cases_count || 0, 5) * 5;
    score += Math.min(cr.total_convictions || 0, 5) * 4;
    if (cr.is_wanted)
        score += 15;
    if (cr.is_absconding)
        score += 10;
    const dangerousCategories = ['murder', 'terrorism', 'kidnapping', 'sexual_offense', 'arms_offense'];
    const hasDangerous = (cr.crime_specialization || []).some((c) => dangerousCategories.includes(c));
    if (hasDangerous)
        score += 20;
    const finalScore = Math.min(100, Math.max(0, score));
    await (0, database_service_1.query)('UPDATE criminals SET risk_score = $1, updated_at = NOW() WHERE id = $2', [finalScore, criminalId]);
    return finalScore;
}
// ─── Duplicate FIR Detection ──────────────────────────────────────────────────
async function detectDuplicateFIR(firId) {
    const fir = await (0, database_service_1.query)('SELECT fir_number, crime_description, incident_location, incident_date FROM fir WHERE id = $1', [firId]);
    if (fir.rowCount === 0)
        return { isDuplicate: false };
    const f = fir.rows[0];
    const keywords = `${f.crime_description} ${f.incident_location}`.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    if (keywords.length === 0)
        return { isDuplicate: false };
    try {
        const conditions = keywords.map((_, i) => `crime_description ILIKE $${i + 1} OR incident_location ILIKE $${i + 1}`);
        const params = keywords.map((k) => `%${k}%`);
        const similar = await (0, database_service_1.query)(`SELECT id, fir_number
       FROM fir
       WHERE id != $1
         AND ABS(EXTRACT(epoch FROM (incident_date - $2::timestamptz)) / 3600) < 72
         AND (${conditions.join(' OR ')})
       LIMIT 1`, [firId, f.incident_date, ...params]);
        if (similar.rows.length > 0) {
            const match = similar.rows[0];
            await (0, database_service_1.query)('UPDATE fir SET is_duplicate = TRUE, duplicate_fir_id = $1, duplicate_score = $2 WHERE id = $3', [match.id, 0.85, firId]);
            return { isDuplicate: true, matchedFirId: match.id, score: 0.85 };
        }
    }
    catch (err) {
        logger_1.logger.warn('Duplicate detection search failed:', err);
    }
    return { isDuplicate: false };
}
// ─── Natural Language Search ──────────────────────────────────────────────────
async function semanticSearch(query_text, filters = {}) {
    const keywords = query_text.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    if (keywords.length === 0)
        return [];
    try {
        const conditions = keywords.map((_, i) => `chunk_text ILIKE $${i + 1}`);
        const params = keywords.map((k) => `%${k}%`);
        let sql = `SELECT chunk_text, source_type, source_id, '{}'::jsonb AS metadata
               FROM document_embeddings
               WHERE ${conditions.join(' OR ')}`;
        if (filters.sourceType) {
            sql += ` AND source_type = $${params.length + 1}`;
            params.push(filters.sourceType);
        }
        sql += ` LIMIT $${params.length + 1}`;
        params.push(String(filters.limit || 10));
        const results = await (0, database_service_1.query)(sql, params);
        return results.rows.map((r, idx) => ({
            source: r.source_type,
            sourceId: r.source_id,
            text: r.chunk_text,
            similarity: 0.7 - idx * 0.05,
            metadata: r.metadata,
        }));
    }
    catch (err) {
        logger_1.logger.warn('Semantic search failed:', err);
        return [];
    }
}
// ─── Export Service ──────────────────────────────────────────────────────────
exports.aiService = {
    generateCaseSummary: summarizeCase,
    calculateRiskScore,
    detectDuplicateFIR,
    semanticSearch,
    chat,
    chatStream,
    generateEmbedding,
    indexDocument,
};
exports.default = exports.aiService;
//# sourceMappingURL=ai.service.js.map