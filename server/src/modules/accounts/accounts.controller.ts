import { Request, Response } from 'express';

import { createAccount, deleteAccount, listAccounts, updateAccount } from './accounts.service';

export function getAccounts(req: Request, res: Response) {
  const user = req.user!;
  const items = listAccounts(user.id);
  res.json({ items });
}

export function postAccount(req: Request, res: Response) {
  const user = req.user!;
  const account = createAccount(user.id, req.body);
  res.status(201).json(account);
}

export function patchAccount(req: Request, res: Response) {
  const user = req.user!;
  const account = updateAccount(user.id, req.params.id, req.body);
  res.json(account);
}

export function removeAccount(req: Request, res: Response) {
  const user = req.user!;
  deleteAccount(user.id, req.params.id);
  res.status(204).send();
}
