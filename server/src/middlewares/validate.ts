import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';

type ValidationTarget = 'body' | 'query' | 'params';

export function validate<T>(schema: ZodSchema<T>, target: ValidationTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req[target]);
    if (!parsed.success) {
      next(parsed.error);
      return;
    }

    if (target === 'body') {
      req.body = parsed.data;
    } else if (target === 'query') {
      req.validatedQuery = parsed.data;
    } else {
      req.params = parsed.data as unknown as Record<string, string>;
    }
    next();
  };
}
