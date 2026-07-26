"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateRangeSchema = exports.UUIDSchema = exports.PaginationSchema = void 0;
exports.validate = validate;
const zod_1 = require("zod");
const error_middleware_1 = require("./error.middleware");
function validate(schema, target = 'body') {
    return (req, _res, next) => {
        const result = schema.safeParse(req[target]);
        if (!result.success) {
            const errors = result.error.errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            }));
            return next(new error_middleware_1.AppError(`Validation failed: ${errors.map((e) => e.message).join(', ')}`, 422, 'VALIDATION_ERROR'));
        }
        req[target] = result.data;
        next();
    };
}
// Common validation schemas
exports.PaginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc', 'ASC', 'DESC']).default('desc'),
    search: zod_1.z.string().optional(),
});
exports.UUIDSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid ID format'),
});
exports.DateRangeSchema = zod_1.z.object({
    dateFrom: zod_1.z.string().datetime().optional(),
    dateTo: zod_1.z.string().datetime().optional(),
});
//# sourceMappingURL=validation.middleware.js.map