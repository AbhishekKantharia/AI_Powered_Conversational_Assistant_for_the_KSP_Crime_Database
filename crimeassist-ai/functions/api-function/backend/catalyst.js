"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("express-async-errors");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("./utils/logger");
const database_service_1 = require("./services/database.service");
const error_middleware_1 = require("./middleware/error.middleware");
const audit_middleware_1 = require("./middleware/audit.middleware");
const routes_1 = require("./routes");
const cache_service_1 = require("./services/cache.service");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
}));
app.use((0, cors_1.default)({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
if (process.env.NODE_ENV !== 'test') {
    app.use((0, morgan_1.default)('combined', {
        stream: { write: (msg) => logger_1.logger.http(msg.trim()) },
    }));
}
app.use(audit_middleware_1.requestLogger);
(0, routes_1.setupRoutes)(app);
app.get('/health', (_req, res) => {
    res.json({
        status: 'healthy',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        service: 'CrimeAssist AI Backend',
    });
});
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.path,
    });
});
app.use(error_middleware_1.errorHandler);
let initialized = false;
async function initApp() {
    if (initialized)
        return;
    try {
        await (0, database_service_1.connectDB)();
        logger_1.logger.info('Database connected successfully');
        await (0, cache_service_1.initializeCache)();
        logger_1.logger.info('Cache initialized');
        initialized = true;
    }
    catch (error) {
        logger_1.logger.error('Failed to initialize:', error);
    }
}
initApp();
module.exports = app;
//# sourceMappingURL=catalyst.js.map