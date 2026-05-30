import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { Env } from "../types/hono.js";
import { db } from "../db/client.js";

export const usersRouter = new OpenAPIHono<Env>();

const UserSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  baseCurrency: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const getMeRoute = createRoute({
  method: "get",
  path: "/me",
  summary: "Get the authenticated user's profile",
  responses: {
    200: {
      description: "The authenticated user's profile",
      content: { "application/json": { schema: UserSchema } },
    },
    401: {
      description: "Missing or invalid authentication token",
      content: {
        "application/json": { schema: z.object({ error: z.string() }) },
      },
    },
    404: {
      description: "User profile not found",
      content: {
        "application/json": { schema: z.object({ error: z.string() }) },
      },
    },
  },
});

usersRouter.openapi(getMeRoute, async (ctx) => {
  const row = await db
    .selectFrom("users")
    .select(["id", "display_name", "base_currency", "created_at", "updated_at"])
    .where("id", "=", ctx.var.userId)
    .executeTakeFirst();

  if (!row) {
    return ctx.json({ error: "User not found" }, 404);
  }

  return ctx.json(
    {
      id: row.id,
      displayName: row.display_name,
      baseCurrency: row.base_currency,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    },
    200,
  );
});
