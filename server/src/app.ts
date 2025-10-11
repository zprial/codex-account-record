import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env";
import { errorHandler } from "./middlewares/error-handler";
import { notFoundHandler } from "./middlewares/not-found-handler";
import { registerModuleRoutes } from "./modules";

export function createApp() {
  const app = express();

  app.set("trust proxy", env.NODE_ENV !== "development");

  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === "production" ? undefined : false
    })
  );
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      time: new Date().toISOString(),
      env: env.NODE_ENV
    });
  });

  app.use("/api", registerModuleRoutes());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
