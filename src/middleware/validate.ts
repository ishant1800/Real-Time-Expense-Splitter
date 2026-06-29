import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/CustomErrors';

/**
 * Express middleware factory that validates request body using a Zod schema.
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const fieldErrors = result.error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`
      );
      return next(new ValidationError('Validation failed', fieldErrors));
    }

    // Assign validated data back to req.body
    req.body = result.data;
    next();
  };
};
