import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import type { Env } from "../types/hono.js";
import { holdingsRouter } from "../routes/holdings.routes.js";
import { assetsRouter } from "../routes/assets.routes.js";
import { pricesRouter } from "../routes/prices.routes.js";

export function createOpenAPIApp(): OpenAPIHono<Env> {
  const app = new OpenAPIHono<Env>();

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
