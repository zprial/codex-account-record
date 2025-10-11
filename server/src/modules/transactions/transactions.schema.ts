import { z } from "zod";

export const transactionTypeEnum = z.enum(["expense", "income", "transfer"]);

const moneySchema = z.number().finite();

const baseTransactionSchema = z.object({
  amount: moneySchema,
  type: transactionTypeEnum,
  accountId: z.string().min(1, "accountId 必填"),
  toAccountId: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  occurredAt: z.coerce.date(),
  description: z.string().trim().max(200).optional(),
  tags: z.array(z.string().trim().min(1)).max(10).optional(),
  attachments: z.array(z.string().url()).max(5).optional(),
  aiJobId: z.string().min(1).optional()
});

export const createTransactionSchema = baseTransactionSchema.extend({
  idempotencyKey: z.string().uuid().optional()
});

export const updateTransactionSchema = baseTransactionSchema.partial().extend({
  idempotencyKey: z.string().uuid().optional()
});

export const listTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  type: transactionTypeEnum.optional(),
  accountId: z.string().optional(),
  categoryId: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  keyword: z.string().max(50).optional(),
  sortBy: z.enum(["occurredAt", "amount"]).default("occurredAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc")
});

export const transactionIdParamsSchema = z.object({
  id: z.string().uuid("交易 ID 需为 UUID")
});
