import winston from 'winston';
export declare const logger: winston.Logger;
export declare const auditLogger: {
    log: (action: string, resource: string, data: Record<string, unknown>) => void;
};
//# sourceMappingURL=logger.d.ts.map