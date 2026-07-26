import { Request, Response, NextFunction } from 'express';
export declare function setupRateLimiters(): void;
export declare const rateLimitGeneral: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const rateLimitAI: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const rateLimitAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const rateLimitStrict: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=rateLimit.middleware.d.ts.map