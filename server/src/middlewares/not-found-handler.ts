import { Request, Response, NextFunction } from "express";

export function notFoundHandler(_req: Request, res: Response, _next: NextFunction) {
  res.status(404).json({
    message: "资源未找到"
  });
}
