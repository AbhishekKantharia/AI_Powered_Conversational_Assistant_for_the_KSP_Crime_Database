import { Server as SocketServer } from 'socket.io';
export declare function setupSocketHandlers(io: SocketServer): void;
export declare function emitToUser(io: SocketServer, userId: string, event: string, data: unknown): void;
export declare function emitToCase(io: SocketServer, caseId: string, event: string, data: unknown): void;
export declare function emitToRole(io: SocketServer, role: string, event: string, data: unknown): void;
//# sourceMappingURL=socket.d.ts.map