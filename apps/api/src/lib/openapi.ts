import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { jwt } from "hono/jwt";
import type { JWTPayload } from "hono/utils/jwt/types";
import type { Env } from "../types/hono.js";
import { parseEnv } from "@dashportfolio/config/env";
import { usersRouter } from "../routes/users.routes.js";
import { holdingsRouter } from "../routes/holdings.routes.js";
import { assetsRouter } from "../routes/assets.routes.js";
import { pricesRouter } from "../routes/prices.routes.js";

export function createOpenAPIApp(): OpenAPIHono<Env> {
  const app = new OpenAPIHono<Env>();
  const { SUPABASE_JWT_SECRET } = parseEnv(process.env);

  app.use(
    jwt({ secret: SUPABASE_JWT_SECRET, alg: "HS256" }),
  );

  app.use(async (ctx, next) => {
    const payload = ctx.get("jwtPayload") as JWTPayload;
    if (typeof payload?.sub !== "string" || !payload.sub) {
      return ctx.json({ error: "Unauthorized" }, 401);
    }
    ctx.set("userId", payload.sub);
    await next();
  });

  app.route("/users", usersRouter);
  app.route("/holdings", holdingsRouter);
  app.route("/assets", assetsRouter);
  app.route("/prices", pricesRouter);

  app.doc("/openapi.json", {
    openapi: "3.1.0",
    info: { title: "DashPortfolio API", version: "0.1.0" },
  });

  app.get("/docs", swaggerUI({ url: "/openapi.json" }));

  return app;
}
