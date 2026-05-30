import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import type { Env } from "./types/hono.js";
import { createOpenAPIApp } from "./lib/openapi.js";

export function createApp(): OpenAPIHono<Env> {
  const app = new OpenAPIHono<Env>();

  app.get("/health", (ctx) => ctx.json({ status: "ok" }));

  app.doc("/v1/openapi.json", {
    openapi: "3.1.0",
    info: { title: "DashPortfolio API", version: "0.1.0" },
  });
  app.get("/v1/docs", swaggerUI({ url: "/v1/openapi.json" }));

  const v1 = createOpenAPIApp();
  app.route("/v1", v1);

  return app;
}
