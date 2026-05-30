import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { HTTPException } from "hono/http-exception";
import type { Env } from "./types/hono.js";
import { createOpenAPIApp } from "./lib/openapi.js";

export function createApp(): OpenAPIHono<Env> {
  const app = new OpenAPIHono<Env>();

  // hono/jwt throws HTTPException with a plain-text body; normalise all HTTP
  // errors to JSON so clients always receive { error: string }.
  app.onError((err, ctx) => {
    if (err instanceof HTTPException) {
      return ctx.json({ error: err.message }, err.status);
    }
    return ctx.json({ error: "Internal server error" }, 500);
  });

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
