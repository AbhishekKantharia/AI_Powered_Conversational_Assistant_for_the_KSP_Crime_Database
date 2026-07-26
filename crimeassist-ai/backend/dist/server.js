"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
require("express-async-errors");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("./utils/logger");
const database_service_1 = require("./services/database.service");
const error_middleware_1 = require("./middleware/error.middleware");
const audit_middleware_1 = require("./middleware/audit.middleware");
const routes_1 = require("./routes");
const socket_1 = require("./utils/socket");
const cache_service_1 = require("./services/cache.service");
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
// ─── Socket.io Setup ────────────────────────────────────────────────────────
exports.io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});
// ─── Security Middleware ─────────────────────────────────────────────────────
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
        },
    },
    crossOriginEmbedderPolicy: false,
}));
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        const allowedOrigins = [
            process.env.CORS_ORIGIN || 'http://localhost:3000',
            process.env.FRONTEND_URL || 'http://localhost:3000',
        ];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));
// ─── General Middleware ───────────────────────────────────────────────────────
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// HTTP request logging (Morgan)
if (process.env.NODE_ENV !== 'test') {
    app.use((0, morgan_1.default)('combined', {
        stream: { write: (msg) => logger_1.logger.http(msg.trim()) },
    }));
}
// Custom audit logging middleware
app.use(audit_middleware_1.requestLogger);
// Serve uploaded files
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
// ─── API Routes ───────────────────────────────────────────────────────────────
(0, routes_1.setupRoutes)(app);
// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({
        status: 'healthy',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        service: 'CrimeAssist AI Backend',
    });
});
// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.path,
    });
});
// ─── Global Error Handler ────────────────────────────────────────────────────
app.use(error_middleware_1.errorHandler);
// ─── Socket.io Handlers ──────────────────────────────────────────────────────
(0, socket_1.setupSocketHandlers)(exports.io);
// ─── Start Server ────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '5000', 10);
async function bootstrap() {
    try {
        // Connect to PostgreSQL
        await (0, database_service_1.connectDB)();
        logger_1.logger.info('✅ Database connected successfully');
        // Initialize cache
        await (0, cache_service_1.initializeCache)();
        logger_1.logger.info('✅ Cache initialized');
        httpServer.listen(PORT, () => {
            logger_1.logger.info(`🚀 CrimeAssist AI Backend running on port ${PORT}`);
            logger_1.logger.info(`📍 Environment: ${process.env.NODE_ENV}`);
            logger_1.logger.info(`🔗 API: http://localhost:${PORT}/api`);
            logger_1.logger.info(`❤️  Health: http://localhost:${PORT}/health`);
        });
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
bootstrap();
exports.default = app;
//# sourceMappingURL=server.js.map