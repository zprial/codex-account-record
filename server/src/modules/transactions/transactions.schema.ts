import { z } from 'zod';

export const transactionTypeEnum = z.enum(['EXPENSE', 'INCOME', 'TRANSFER']);

const moneySchema = z.number().finite();

const baseTransactionSchema = z.object({
  amount: moneySchema,
  type: transactionTypeEnum,
  accountId: z.string().uuid('账户 ID 无效'),
  toAccountId: z.string().uuid('目标账户 ID 无效').optional(),
  categoryId: z.string().uuid('分类 ID 无效').optional(),
  occurredAt: z.coerce.date(),
  description: z.string().trim().max(200).optional(),
  tags: z.array(z.string().trim().min(1)).max(10).optional(),
  attachments: z.array(z.string().url()).max(5).optional(),
  aiJobId: z.string().trim().min(1).optional()
});

export const createTransactionSchema = baseTransactionSchema.extend({
  idempotencyKey: z.string().uuid().optional()
});

export const updateTransactionSchema = z
  .object({
    amount: moneySchema.optional(),
    type: transactionTypeEnum.optional(),
    accountId: z.string().uuid('账户 ID 无效').optional(),
    toAccountId: z.string().uuid('目标账户 ID 无效').nullable().optional(),
    categoryId: z.string().uuid('分类 ID 无效').nullable().optional(),
    occurredAt: z.coerce.date().optional(),
    description: z.string().trim().max(200).optional(),
    tags: z.array(z.string().trim().min(1)).max(10).optional(),
    attachments: z.array(z.string().url()).max(5).optional(),
    aiJobId: z.string().trim().min(1).optional()
  })
  .refine((data) => {
    if (data.type === 'TRANSFER') {
      return data.toAccountId !== null;
    }
    return true;
  }, '转账交易需要目标账户');

export const listTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  type: transactionTypeEnum.optional(),
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  keyword: z.string().max(50).optional(),
  sortBy: z.enum(['occurredAt', 'amount']).default('occurredAt'),
  sortDirection: z.enum(['asc', 'desc']).default('desc')
});

export const transactionIdParamsSchema = z.object({
  id: z.string().uuid('交易 ID 需为 UUID')
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
