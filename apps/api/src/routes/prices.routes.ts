import { OpenAPIHono } from "@hono/zod-openapi";
import type { Env } from "../types/hono.js";

export const pricesRouter = new OpenAPIHono<Env>();

// TODO: implement price candle routes
