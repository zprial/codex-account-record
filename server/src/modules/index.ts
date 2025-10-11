import { Router } from "express";

import { authRouter } from "./auth/auth.router";
import { transactionsRouter } from "./transactions/transactions.router";

export function registerModuleRoutes() {
  const router = Router();

  router.use("/auth", authRouter);
  router.use("/transactions", transactionsRouter);

  return router;
}
