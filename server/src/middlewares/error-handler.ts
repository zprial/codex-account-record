import { Request, Response } from 'express';
import { ZodError } from 'zod';

interface AppError extends Error {
  status?: number;
  code?: string;
  details?: unknown;
}

export function errorHandler(err: AppError, _req: Request, res: Response) {
  if (res.headersSent) {
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      message: '请求参数验证失败',
      issues: err.issues
    });
    return;
  }

  const status = err.status ?? 500;

  res.status(status).json({
    message: err.message || (status === 500 ? '服务器内部错误' : '请求无法完成'),
    code: err.code,
    details: err.details
  });
}
