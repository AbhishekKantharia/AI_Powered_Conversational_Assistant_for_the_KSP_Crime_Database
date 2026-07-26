import { Request, Response, NextFunction } from 'express';
export interface JwtPayload {
    userId: string;
    username: string;
    email: string;
    role: string;
    stationId?: string;
    districtId?: string;
    iat?: number;
    exp?: number;
}
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}
export declare const authenticate: (req: Request, _res: Response, next: NextFunction) => Promise<void>;
export declare const optionalAuthenticate: (req: Request, _res: Response, next: NextFunction) => Promise<void>;
export declare function generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string;
export declare function generateRefreshToken(userId: string): string;
export declare function verifyRefreshToken(token: string): {
    userId: string;
};
//# sourceMappingURL=auth.middleware.d.ts.map