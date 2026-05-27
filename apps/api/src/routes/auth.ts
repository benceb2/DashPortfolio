import { OpenAPIHono } from "@hono/zod-openapi";
import type { Env } from "../types/hono.js";

export const authRouter = new OpenAPIHono<Env>();

// TODO: implement auth routes (register, login callbacks)
