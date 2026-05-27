import type { Context, Next } from "hono";
import type { Env } from "../types/hono.js";

export async function authMiddleware(ctx: Context<Env>, next: Next): Promise<void> {
  const authHeader = ctx.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    ctx.res = ctx.json({ error: "Unauthorized" }, 401);
    return;
  }

  const token = authHeader.slice(7);

  // TODO: verify JWT with Supabase JWT secret and extract sub claim
  // For now, stub — replace with real verification before shipping
  void token;

  ctx.set("userId", "usr_stub");
  await next();
}
