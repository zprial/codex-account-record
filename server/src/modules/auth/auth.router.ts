import { Router } from "express";

import {
  login,
  logout,
  refreshToken,
  register
} from "./auth.controller";
import {
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registerSchema
} from "./auth.schema";
import { validateBody } from "../../middlewares/validate-request";

export const authRouter = Router();

authRouter.post("/register", validateBody(registerSchema), register);
authRouter.post("/login", validateBody(loginSchema), login);
authRouter.post("/refresh", validateBody(refreshTokenSchema), refreshToken);
authRouter.post("/logout", validateBody(logoutSchema), logout);
