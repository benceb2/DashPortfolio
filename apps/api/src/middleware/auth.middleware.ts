import { jwt } from "hono/jwt";
import type { MiddlewareHandler } from "hono";
import type { JWTPayload } from "hono/utils/jwt/types";
import type { Env } from "../types/hono.js";
import { parseEnv } from "@dashportfolio/config/env";

const { SUPABASE_JWT_SECRET } = parseEnv(process.env);

export const jwtMiddleware = jwt({ secret: SUPABASE_JWT_SECRET, alg: "HS256" });

export const extractUserId: MiddlewareHandler<Env> = async (ctx, next) => {
  const payload = ctx.get("jwtPayload") as JWTPayload;
  if (typeof payload?.sub !== "string" || !payload.sub) {
    return ctx.json({ error: "Unauthorized" }, 401);
  }
  ctx.set("userId", payload.sub);
  await next();
};
