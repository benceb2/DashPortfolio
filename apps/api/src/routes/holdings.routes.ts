import { OpenAPIHono } from "@hono/zod-openapi";
import type { Env } from "../types/hono.js";

export const holdingsRouter = new OpenAPIHono<Env>();

// TODO: implement holdings CRUD routes
