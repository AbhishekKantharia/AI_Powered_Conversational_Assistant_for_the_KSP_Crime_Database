export declare function initializeCache(): Promise<void>;
export declare function cacheGet<T>(key: string): Promise<T | null>;
export declare function cacheSet(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
export declare function cacheDelete(pattern: string): Promise<void>;
export declare function disconnectCache(): Promise<void>;
export declare function withCache(keyFn: (req: unknown) => string, ttl?: number): (req: unknown, res: unknown, next: () => void) => Promise<void>;
//# sourceMappingURL=cache.service.d.ts.map