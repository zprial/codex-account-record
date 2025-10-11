import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

import { env } from '../config/env';
import { HttpError } from '../utils/http-error';
import { getUserById } from '../modules/auth/auth.service';

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) {
    throw new HttpError(401, '未授权访问', { code: 'UNAUTHORIZED' });
  }

  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new HttpError(401, '未授权访问', { code: 'UNAUTHORIZED' });
  }

  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
  } catch (_error) {
    throw new HttpError(401, '访问令牌无效', { code: 'INVALID_ACCESS_TOKEN' });
  }

  if (!payload.sub) {
    throw new HttpError(401, '访问令牌无效', { code: 'INVALID_ACCESS_TOKEN' });
  }

  const user = getUserById(payload.sub);
  req.user = user;
  next();
}
