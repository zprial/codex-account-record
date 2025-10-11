import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodEffects } from "zod";

type ZodSchema<T> = AnyZodObject | ZodEffects<AnyZodObject, T>;

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.body = schema.parse(req.body);
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.query = schema.parse(req.query);
    next();
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.params = schema.parse(req.params);
    next();
  };
}
