"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketHandlers = setupSocketHandlers;
exports.emitToUser = emitToUser;
exports.emitToCase = emitToCase;
exports.emitToRole = emitToRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("./logger");
function setupSocketHandlers(io) {
    // Auth middleware for socket
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token)
            return next(new Error('Authentication required'));
        try {
            const secret = process.env.JWT_ACCESS_SECRET;
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            socket.data.user = decoded;
            next();
        }
        catch {
            next(new Error('Invalid token'));
        }
    });
    io.on('connection', (socket) => {
        const userId = socket.data.user?.userId;
        logger_1.logger.info(`Socket connected: ${socket.id} (user: ${userId})`);
        // Join user-specific room
        if (userId)
            socket.join(`user:${userId}`);
        // Join role-based rooms
        const role = socket.data.user?.role;
        if (role)
            socket.join(`role:${role}`);
        socket.on('join:case', (caseId) => {
            socket.join(`case:${caseId}`);
            logger_1.logger.debug(`User ${userId} joined case room: ${caseId}`);
        });
        socket.on('leave:case', (caseId) => {
            socket.leave(`case:${caseId}`);
        });
        socket.on('disconnect', () => {
            logger_1.logger.info(`Socket disconnected: ${socket.id}`);
        });
    });
}
// Emit helpers
function emitToUser(io, userId, event, data) {
    io.to(`user:${userId}`).emit(event, data);
}
function emitToCase(io, caseId, event, data) {
    io.to(`case:${caseId}`).emit(event, data);
}
function emitToRole(io, role, event, data) {
    io.to(`role:${role}`).emit(event, data);
}
//# sourceMappingURL=socket.js.map