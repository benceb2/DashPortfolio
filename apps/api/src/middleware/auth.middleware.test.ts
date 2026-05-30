import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { SignJWT } from "jose";
import { authMiddleware } from "./auth.middleware.js";
import { makeJwt, TEST_USER_ID } from "../test/helpers.js";
import type { Env } from "../types/hono.js";

const app = new Hono<Env>();
app.use("/protected", authMiddleware);
app.get("/protected", (ctx) => ctx.json({ userId: ctx.get("userId") }));

describe("authMiddleware", () => {
  it("passes and sets userId for a valid JWT", async () => {
    const token = await makeJwt();
    const res = await app.request("/protected", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ userId: TEST_USER_ID });
  });

  it("returns 401 when Authorization header is absent", async () => {
    const res = await app.request("/protected");
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("returns 401 when Authorization header does not use Bearer scheme", async () => {
    const token = await makeJwt();
    const res = await app.request("/protected", {
      headers: { Authorization: `Basic ${token}` },
    });
    expect(res.status).toBe(401);
  });

  it("returns 401 for an expired JWT", async () => {
    const token = await makeJwt({ exp: Math.floor(Date.now() / 1000) - 10 });
    const res = await app.request("/protected", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("returns 401 for a JWT signed with a different secret", async () => {
    const wrongSecret = new TextEncoder().encode("wrong-secret-32-bytes-or-more-padding");
    const token = await new SignJWT({ sub: TEST_USER_ID })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(Math.floor(Date.now() / 1000) + 3600)
      .sign(wrongSecret);
    const res = await app.request("/protected", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(401);
  });

  it("returns 401 for a malformed token string", async () => {
    const res = await app.request("/protected", {
      headers: { Authorization: "Bearer not.a.jwt" },
    });
    expect(res.status).toBe(401);
  });
});
