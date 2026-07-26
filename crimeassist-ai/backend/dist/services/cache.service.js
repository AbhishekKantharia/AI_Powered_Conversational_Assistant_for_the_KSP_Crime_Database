"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeCache = initializeCache;
exports.cacheGet = cacheGet;
exports.cacheSet = cacheSet;
exports.cacheDelete = cacheDelete;
exports.disconnectCache = disconnectCache;
exports.withCache = withCache;
const redis_1 = require("redis");
const logger_1 = require("../utils/logger");
let redisClient = null;
const memoryCache = new Map();
async function initializeCache() {
    if (process.env.REDIS_URL) {
        try {
            redisClient = (0, redis_1.createClient)({
                url: process.env.REDIS_URL,
                password: process.env.REDIS_PASSWORD || undefined,
            });
            redisClient.on('error', (err) => logger_1.logger.error('Redis error:', err));
            redisClient.on('connect', () => logger_1.logger.info('Redis connected'));
            await redisClient.connect();
        }
        catch (err) {
            logger_1.logger.warn('Redis connection failed, using in-memory cache:', err);
            redisClient = null;
        }
    }
    else {
        logger_1.logger.info('No REDIS_URL configured, using in-memory cache');
    }
}
async function cacheGet(key) {
    if (redisClient) {
        try {
            const value = await redisClient.get(key);
            return value ? JSON.parse(value) : null;
        }
        catch {
            return null;
        }
    }
    const entry = memoryCache.get(key);
    if (entry && Date.now() < entry.expiresAt) {
        return entry.value;
    }
    memoryCache.delete(key);
    return null;
}
async function cacheSet(key, value, ttlSeconds = 3600) {
    if (redisClient) {
        try {
            await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
        }
        catch (err) {
            logger_1.logger.warn('Cache set failed:', err);
        }
        return;
    }
    memoryCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}
async function cacheDelete(pattern) {
    if (redisClient) {
        try {
            const keys = await redisClient.keys(pattern);
            if (keys.length > 0)
                await redisClient.del(keys);
        }
        catch { }
        return;
    }
    for (const key of memoryCache.keys()) {
        if (key.includes(pattern.replace('*', ''))) {
            memoryCache.delete(key);
        }
    }
}
async function disconnectCache() {
    if (redisClient) {
        await redisClient.disconnect();
    }
}
// Cache middleware factory
function withCache(keyFn, ttl = 300) {
    return async (req, res, next) => {
        const key = keyFn(req);
        const cached = await cacheGet(key);
        if (cached) {
            ;
            res.json({ success: true, data: cached, cached: true });
            return;
        }
        const origJson = res.json.bind(res);
        res.json = (data) => {
            const d = data;
            if (d?.success && d?.data) {
                cacheSet(key, d.data, ttl);
            }
            return origJson(data);
        };
        next();
    };
}
//# sourceMappingURL=cache.service.js.map