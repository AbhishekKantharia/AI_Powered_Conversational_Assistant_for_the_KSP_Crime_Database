"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoutes = setupRoutes;
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const cases_routes_1 = __importDefault(require("./cases.routes"));
const fir_routes_1 = __importDefault(require("./fir.routes"));
const criminals_routes_1 = __importDefault(require("./criminals.routes"));
const analytics_routes_1 = __importDefault(require("./analytics.routes"));
const ai_routes_1 = __importDefault(require("./ai.routes"));
const reports_routes_1 = __importDefault(require("./reports.routes"));
const users_routes_1 = __importDefault(require("./users.routes"));
const settings_routes_1 = __importDefault(require("./settings.routes"));
const evidence_routes_1 = __importDefault(require("./evidence.routes"));
const public_data_routes_1 = __importDefault(require("./public-data.routes"));
function setupRoutes(app) {
    (0, rateLimit_middleware_1.setupRateLimiters)();
    const API_PREFIX = '/api/v1';
    app.use(`${API_PREFIX}/auth`, auth_routes_1.default);
    app.use(`${API_PREFIX}/cases`, cases_routes_1.default);
    app.use(`${API_PREFIX}/fir`, fir_routes_1.default);
    app.use(`${API_PREFIX}/criminals`, criminals_routes_1.default);
    app.use(`${API_PREFIX}/analytics`, analytics_routes_1.default);
    app.use(`${API_PREFIX}/ai`, ai_routes_1.default);
    app.use(`${API_PREFIX}/reports`, reports_routes_1.default);
    app.use(`${API_PREFIX}/users`, users_routes_1.default);
    app.use(`${API_PREFIX}/settings`, settings_routes_1.default);
    app.use(`${API_PREFIX}/evidence`, evidence_routes_1.default);
    app.use(`${API_PREFIX}/public-data`, public_data_routes_1.default);
    // Also support /api prefix (no version)
    app.use('/api/auth', auth_routes_1.default);
    app.use('/api/cases', cases_routes_1.default);
    app.use('/api/fir', fir_routes_1.default);
    app.use('/api/criminals', criminals_routes_1.default);
    app.use('/api/analytics', analytics_routes_1.default);
    app.use('/api/ai', ai_routes_1.default);
    app.use('/api/reports', reports_routes_1.default);
    app.use('/api/users', users_routes_1.default);
    app.use('/api/settings', settings_routes_1.default);
    app.use('/api/evidence', evidence_routes_1.default);
    app.use('/api/public-data', public_data_routes_1.default);
}
//# sourceMappingURL=index.js.map