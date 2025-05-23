import { Request, Response, NextFunction } from 'express';

// Wrapper to handle async errors in Express route handlers
export const asyncWrapper =
  (fn: any) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };
