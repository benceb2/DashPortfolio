import { OpenAPIHono } from "@hono/zod-openapi";
import type { Env } from "../types/hono.js";
import { jwtMiddleware, extractUserId } from "../middleware/auth.middleware.js";
import { usersRouter } from "../routes/users.routes.js";
import { holdingsRouter } from "../routes/holdings.routes.js";
import { assetsRouter } from "../routes/assets.routes.js";
import { pricesRouter } from "../routes/prices.routes.js";

export function createOpenAPIApp(): OpenAPIHono<Env> {
  const app = new OpenAPIHono<Env>();

  app.use(jwtMiddleware);
  app.use(extractUserId);

  app.route("/users", usersRouter);
  app.route("/holdings", holdingsRouter);
  app.route("/assets", assetsRouter);
  app.route("/prices", pricesRouter);

  return app;
}
