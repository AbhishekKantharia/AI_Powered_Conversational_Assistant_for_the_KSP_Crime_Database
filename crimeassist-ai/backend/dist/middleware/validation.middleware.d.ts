import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
export declare function validate(schema: ZodSchema, target?: 'body' | 'query' | 'params'): (req: Request, _res: Response, next: NextFunction) => void;
export declare const PaginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc", "ASC", "DESC"]>>;
    search: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortOrder: "ASC" | "DESC" | "asc" | "desc";
    sortBy?: string | undefined;
    search?: string | undefined;
}, {
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: string | undefined;
    sortOrder?: "ASC" | "DESC" | "asc" | "desc" | undefined;
    search?: string | undefined;
}>;
export declare const UUIDSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const DateRangeSchema: z.ZodObject<{
    dateFrom: z.ZodOptional<z.ZodString>;
    dateTo: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
}, {
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
}>;
//# sourceMappingURL=validation.middleware.d.ts.map