import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
export declare function getPool(): Pool;
export declare function connectDB(): Promise<void>;
export declare function disconnectDB(): Promise<void>;
export declare function query<T extends QueryResultRow = Record<string, unknown>>(text: string, params?: unknown[]): Promise<QueryResult<T>>;
export declare function withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T>;
export interface PaginationOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export declare function buildPagination(options: PaginationOptions): {
    limit: number;
    offset: number;
    page: number;
};
export declare function buildPaginatedResponse<T>(data: T[], total: number, page: number, limit: number): PaginatedResult<T>;
export declare function vectorSearch(embedding: number[], sourceType: string, limit?: number, threshold?: number): Promise<Array<{
    id: string;
    source_id: string;
    chunk_text: string;
    similarity: number;
    metadata: Record<string, unknown>;
}>>;
export declare function globalVectorSearch(embedding: number[], limit?: number, threshold?: number): Promise<Array<{
    id: string;
    source_type: string;
    source_id: string;
    chunk_text: string;
    similarity: number;
    metadata: Record<string, unknown>;
}>>;
//# sourceMappingURL=database.service.d.ts.map