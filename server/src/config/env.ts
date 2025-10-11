import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.string().default("3000"),
  JWT_ACCESS_SECRET: z.string().min(1).default("dev-access-secret"),
  JWT_REFRESH_SECRET: z.string().min(1).default("dev-refresh-secret")
});

export const env = envSchema.parse(process.env);

export const isProd = env.NODE_ENV === "production";
