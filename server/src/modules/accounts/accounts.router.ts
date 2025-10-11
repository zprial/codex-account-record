import { Router } from 'express';

import { requireAuth } from '../../middlewares/require-auth';
import { validateBody, validateParams } from '../../middlewares/validate-request';
import { accountIdParamsSchema, createAccountSchema, updateAccountSchema } from './accounts.schema';
import { getAccounts, patchAccount, postAccount, removeAccount } from './accounts.controller';

export const accountsRouter = Router();

accountsRouter.use(requireAuth);
accountsRouter.get('/', getAccounts);
accountsRouter.post('/', validateBody(createAccountSchema), postAccount);
accountsRouter.patch(
  '/:id',
  validateParams(accountIdParamsSchema),
  validateBody(updateAccountSchema),
  patchAccount
);
accountsRouter.delete('/:id', validateParams(accountIdParamsSchema), removeAccount);
