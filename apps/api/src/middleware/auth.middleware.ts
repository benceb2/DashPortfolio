import type { Context, Next } from "hono";
import { jwtVerify, type JWTPayload } from "jose";
import { parseEnv } from "@dashportfolio/config/env";
import type { Env } from "../types/hono.js";

const env = parseEnv(process.env);
const secret = new TextEncoder().encode(env.SUPABASE_JWT_SECRET);

interface SupabaseJWTPayload extends JWTPayload {
  sub: string;
  role?: string;
}

export async function authMiddleware(ctx: Context<Env>, next: Next): Promise<void> {
  const authHeader = ctx.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    ctx.res = ctx.json({ error: "Unauthorized" }, 401);
    return;
  }

  const token = authHeader.slice("Bearer ".length);

  let payload: SupabaseJWTPayload;
  try {
    const result = await jwtVerify<SupabaseJWTPayload>(token, secret, {
      algorithms: ["HS256"],
    });
    payload = result.payload;
  } catch {
    ctx.res = ctx.json({ error: "Unauthorized" }, 401);
    return;
  }

  ctx.set("userId", payload.sub);
  await next();
}
