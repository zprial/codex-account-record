import { Request, Response } from 'express';

import {
  createTransaction as createTransactionService,
  deleteTransaction as deleteTransactionService,
  getTransactionDetail,
  listTransactions as listTransactionsService,
  updateTransaction as updateTransactionService
} from './transactions.service';
import type {
  CreateTransactionInput,
  ListTransactionsQuery,
  UpdateTransactionInput
} from './transactions.schema';

export function listTransactions(req: Request, res: Response) {
  const user = req.user!;
  const result = listTransactionsService(user.id, req.query as unknown as ListTransactionsQuery);
  res.json(result);
}

export function getTransaction(req: Request, res: Response) {
  const user = req.user!;
  const item = getTransactionDetail(user.id, req.params.id);
  res.json(item);
}

export function createTransaction(req: Request, res: Response) {
  const user = req.user!;
  const item = createTransactionService(user.id, req.body as CreateTransactionInput);
  res.status(201).json(item);
}

export function updateTransaction(req: Request, res: Response) {
  const user = req.user!;
  const item = updateTransactionService(user.id, req.params.id, req.body as UpdateTransactionInput);
  res.json(item);
}

export function deleteTransaction(req: Request, res: Response) {
  const user = req.user!;
  deleteTransactionService(user.id, req.params.id);
  res.status(204).send();
}
