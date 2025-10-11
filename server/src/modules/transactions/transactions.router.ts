import { Router } from "express";

import {
  createTransaction,
  deleteTransaction,
  getTransaction,
  listTransactions,
  updateTransaction
} from "./transactions.controller";
import {
  createTransactionSchema,
  listTransactionsQuerySchema,
  transactionIdParamsSchema,
  updateTransactionSchema
} from "./transactions.schema";
import {
  validateBody,
  validateParams,
  validateQuery
} from "../../middlewares/validate-request";

export const transactionsRouter = Router();

transactionsRouter.get(
  "/",
  validateQuery(listTransactionsQuerySchema),
  listTransactions
);

transactionsRouter.post(
  "/",
  validateBody(createTransactionSchema),
  createTransaction
);

transactionsRouter.get(
  "/:id",
  validateParams(transactionIdParamsSchema),
  getTransaction
);

transactionsRouter.patch(
  "/:id",
  validateParams(transactionIdParamsSchema),
  validateBody(updateTransactionSchema),
  updateTransaction
);

transactionsRouter.delete(
  "/:id",
  validateParams(transactionIdParamsSchema),
  deleteTransaction
);
