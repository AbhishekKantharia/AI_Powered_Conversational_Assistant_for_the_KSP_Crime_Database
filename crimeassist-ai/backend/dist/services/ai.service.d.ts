export declare function generateEmbedding(_text: string): Promise<number[]>;
export declare function indexDocument(sourceType: string, sourceId: string, text: string, metadata?: Record<string, unknown>): Promise<void>;
export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}
export interface ChatResponse {
    content: string;
    sources: Array<{
        source: string;
        sourceId: string;
        similarity: number;
    }>;
    tokensUsed: number;
    processingTimeMs: number;
    model: string;
}
export declare function chat(messages: ChatMessage[], sessionId: string, useRAG?: boolean): Promise<ChatResponse>;
export declare function chatStream(messages: ChatMessage[], onChunk: (chunk: string) => void, onDone: (usage: {
    tokensUsed: number;
    sources: Array<{
        source: string;
        sourceId: string;
    }>;
}) => void): Promise<void>;
export declare function summarizeCase(caseId: string): Promise<string>;
export declare function calculateRiskScore(criminalId: string): Promise<number>;
export declare function detectDuplicateFIR(firId: string): Promise<{
    isDuplicate: boolean;
    matchedFirId?: string;
    score?: number;
}>;
export declare function semanticSearch(query_text: string, filters?: {
    sourceType?: string;
    limit?: number;
}): Promise<Array<{
    source: string;
    sourceId: string;
    text: string;
    similarity: number;
    metadata: Record<string, unknown>;
}>>;
export declare const aiService: {
    generateCaseSummary: typeof summarizeCase;
    calculateRiskScore: typeof calculateRiskScore;
    detectDuplicateFIR: typeof detectDuplicateFIR;
    semanticSearch: typeof semanticSearch;
    chat: typeof chat;
    chatStream: typeof chatStream;
    generateEmbedding: typeof generateEmbedding;
    indexDocument: typeof indexDocument;
};
export default aiService;
//# sourceMappingURL=ai.service.d.ts.map