import { OpenAPIHono } from "@hono/zod-openapi";
import type { Env } from "../types/hono.js";

export const assetsRouter = new OpenAPIHono<Env>();

// TODO: implement assets routes (search, list)
