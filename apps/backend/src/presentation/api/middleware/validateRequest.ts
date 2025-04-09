import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import logger from '../../../shared/logger';

/**
 * Middleware factory function to validate request data against a Zod schema.
 * @param schema - The Zod schema to validate against (e.g., sessionLoginSchema).
 */
export const validateRequest =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
         // Log the detailed validation error
        logger.warn({ validationErrors: error.errors, url: req.originalUrl }, 'Request validation failed.');
        // Format errors for the client response
        const formattedErrors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return res.status(400).json({
          message: 'Input validation failed',
          errors: formattedErrors,
        });
      }
      // Handle unexpected errors during validation
      if (error instanceof Error) {
        logger.error({ error: error.message, stack: error.stack, url: req.originalUrl }, 'Unexpected error during request validation.');
      } else {
        logger.error({ error: error, url: req.originalUrl }, 'Unexpected error during request validation.');
      }
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  };