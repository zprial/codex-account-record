import { Request, Response } from 'express';

import {
  authenticateUser,
  registerUser,
  rotateRefreshToken,
  revokeRefreshToken
} from './auth.service';

export async function register(req: Request, res: Response) {
  const result = await registerUser(req.body);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response) {
  const result = await authenticateUser(req.body);
  res.json(result);
}

export async function refreshToken(req: Request, res: Response) {
  const result = await rotateRefreshToken(req.body.refreshToken);
  res.json(result);
}

export async function logout(req: Request, res: Response) {
  await revokeRefreshToken(req.body.refreshToken);
  res.status(204).send();
}
