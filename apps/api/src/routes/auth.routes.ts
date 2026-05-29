import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { parseEnv } from "@dashportfolio/config/env";
import { authMiddleware } from "../middleware/auth.middleware.js";
import type { Env } from "../types/hono.js";

const env = parseEnv(process.env);

export const authRouter = new OpenAPIHono<Env>();

const TokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number(),
  token_type: z.string(),
});

const SupabaseTokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number(),
  token_type: z.string().default("bearer"),
});

const ErrorSchema = z.object({
  error: z.string(),
});

const loginRoute = createRoute({
  method: "post",
  path: "/login",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            email: z.string().email(),
            password: z.string().min(1),
          }),
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: TokenResponseSchema } },
      description: "Successful login",
    },
    401: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Invalid credentials",
    },
  },
});

authRouter.openapi(loginRoute, async (ctx) => {
  const { email, password } = ctx.req.valid("json");

  const res = await fetch(
    `${env.SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({ email, password }),
    },
  );

  if (!res.ok) {
    return ctx.json({ error: "Invalid credentials" }, 401);
  }

  const data = SupabaseTokenResponseSchema.parse(await res.json());
  return ctx.json(data, 200);
});

const refreshRoute = createRoute({
  method: "post",
  path: "/refresh",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({ refresh_token: z.string().min(1) }),
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: TokenResponseSchema } },
      description: "Refreshed token pair",
    },
    401: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Invalid or expired refresh token",
    },
  },
});

authRouter.openapi(refreshRoute, async (ctx) => {
  const { refresh_token } = ctx.req.valid("json");

  const res = await fetch(
    `${env.SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({ refresh_token }),
    },
  );

  if (!res.ok) {
    return ctx.json({ error: "Invalid or expired refresh token" }, 401);
  }

  const data = SupabaseTokenResponseSchema.parse(await res.json());
  return ctx.json(data, 200);
});

const logoutRoute = createRoute({
  method: "post",
  path: "/logout",
  middleware: [authMiddleware] as const,
  security: [{ bearerAuth: [] }],
  responses: {
    204: { description: "Logged out" },
    401: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Not authenticated",
    },
  },
});

authRouter.openapi(logoutRoute, async (ctx) => {
  const authHeader = ctx.req.header("Authorization") ?? "";

  await fetch(`${env.SUPABASE_URL}/auth/v1/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: authHeader,
    },
  });

  return ctx.body(null, 204);
});
