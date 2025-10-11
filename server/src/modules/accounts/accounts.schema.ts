import { z } from 'zod';

export const accountTypeEnum = z.enum([
  'CASH',
  'BANK',
  'CREDIT',
  'E_WALLET',
  'INVESTMENT',
  'OTHER'
]);

export const createAccountSchema = z.object({
  name: z.string().trim().min(1, '账户名称必填').max(50),
  type: accountTypeEnum.default('OTHER'),
  currency: z.string().trim().length(3, '币种需为 3 位编码').default('CNY'),
  initialBalance: z.number().finite().default(0)
});

export const updateAccountSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  type: accountTypeEnum.optional(),
  currency: z.string().trim().length(3).optional(),
  isArchived: z.boolean().optional()
});

export const accountIdParamsSchema = z.object({
  id: z.string().uuid('账户 ID 需为 UUID')
});
