import { NextFunction, Request, Response } from 'express';

export const asyncH = <T extends (req: Request, res: Response, next: NextFunction) => any>(fn: T) =>
  (req: Request, res: Response, next: NextFunction) => Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Generic error handler middleware
 * @param err
 * @param _req
 * @param res
 * @param _next
 */
export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err?.status ?? 500;
  const message = err?.message ?? 'Internal Server Error';
  // TODO: add structured logging
  res.status(status).json({ error: message });
};
