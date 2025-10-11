import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().trim().email('邮箱格式不正确'),
  password: z.string().min(8, '密码至少 8 位'),
  name: z.string().trim().min(1, '昵称必填')
});

export const loginSchema = z.object({
  email: z.string().trim().email('邮箱格式不正确'),
  password: z.string().min(1, '密码必填')
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken 必填')
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken 必填')
});
