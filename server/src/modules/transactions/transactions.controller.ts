import { Request, Response } from "express";

const sampleTransaction = {
  id: "tx_stub_1",
  amount: 128.5,
  type: "expense",
  accountId: "account_stub_1",
  categoryId: "category_stub_food",
  occurredAt: new Date().toISOString(),
  description: "样例交易数据，待接入真实后端",
  tags: ["stub"],
  attachments: [],
  aiJobId: null
};

export async function listTransactions(_req: Request, res: Response) {
  res.json({
    items: [sampleTransaction],
    pagination: {
      page: 1,
      pageSize: 20,
      totalItems: 1,
      totalPages: 1
    }
  });
}

export async function getTransaction(_req: Request, res: Response) {
  res.json(sampleTransaction);
}

export async function createTransaction(req: Request, res: Response) {
  const payload = req.body;

  res.status(201).json({
    ...sampleTransaction,
    ...payload,
    id: "tx_stub_created",
    occurredAt: new Date(payload.occurredAt).toISOString()
  });
}

export async function updateTransaction(req: Request, res: Response) {
  const payload = req.body;
  res.json({
    ...sampleTransaction,
    ...payload,
    id: req.params.id,
    occurredAt: payload.occurredAt
      ? new Date(payload.occurredAt).toISOString()
      : sampleTransaction.occurredAt
  });
}

export async function deleteTransaction(req: Request, res: Response) {
  res.status(204).send();
}
