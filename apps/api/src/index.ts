import "dotenv/config";
import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { parseEnv } from "@dashportfolio/config/env";

const env = parseEnv(process.env);
const app = createApp();

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`);
});
