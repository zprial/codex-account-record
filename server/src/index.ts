import { createApp } from "./app";
import { env } from "./config/env";

export async function startServer() {
  const app = createApp();
  const port = Number(env.PORT);

  await new Promise<void>((resolve) => {
    app.listen(port, () => {
      console.log(`[server] listening on port ${port}`);
      resolve();
    });
  });
}

if (env.NODE_ENV !== "test") {
  startServer().catch((error) => {
    console.error("[server] failed to start", error);
    process.exitCode = 1;
  });
}
