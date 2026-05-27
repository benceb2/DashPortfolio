import { Hono } from "hono";
import type { Env } from "./types/hono.js";
import { createOpenAPIApp } from "./lib/openapi.js";

export function createApp(): Hono<Env> {
  const app = new Hono<Env>();

  app.get("/health", (ctx) => ctx.json({ status: "ok" }));
  app.route("/v1", createOpenAPIApp());

  return app;
}
