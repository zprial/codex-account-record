import { Request, Response } from "express";

const stubUser = {
  id: "user_stub_1",
  email: "demo@example.com",
  name: "记账小助手",
  avatar: null,
  createdAt: new Date().toISOString()
};

const stubTokens = {
  accessToken: "stub-access-token",
  refreshToken: "stub-refresh-token"
};

export async function register(req: Request, res: Response) {
  const { email, name } = req.body;

  res.status(201).json({
    user: {
      ...stubUser,
      email,
      name
    },
    tokens: stubTokens
  });
}

export async function login(req: Request, res: Response) {
  const { email } = req.body;

  res.json({
    user: {
      ...stubUser,
      email
    },
    tokens: stubTokens
  });
}

export async function refreshToken(_req: Request, res: Response) {
  res.json({
    tokens: {
      accessToken: "stub-access-token-refreshed",
      refreshToken: "stub-refresh-token"
    }
  });
}

export async function logout(_req: Request, res: Response) {
  res.status(204).send();
}
