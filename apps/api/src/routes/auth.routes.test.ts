import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { Hono } from "hono";
import nock from "nock";
import { makeJwt, supabaseAuth, validTokenResponse, SUPABASE_URL } from "../test/helpers.js";

describe("auth routes", () => {
  let app: Hono;

  beforeAll(async () => {
    const { authRouter } = await import("./auth.routes.js");
    app = new Hono().route("/auth", authRouter);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe("POST /auth/tokens", () => {
    it("returns tokens on valid credentials", async () => {
      supabaseAuth()
        .post("/auth/v1/token", { email: "user@example.com", password: "secret" })
        .query({ grant_type: "password" })
        .reply(200, validTokenResponse);

      const res = await app.request("/auth/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "user@example.com", password: "secret" }),
      });

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(validTokenResponse);
      expect(nock.isDone()).toBe(true);
    });

    it("returns 401 when Supabase rejects credentials", async () => {
      supabaseAuth()
        .post("/auth/v1/token")
        .query({ grant_type: "password" })
        .reply(400, { error: "invalid_grant" });

      const res = await app.request("/auth/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "user@example.com", password: "wrong" }),
      });

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: "Invalid credentials" });
    });

    it("returns 400 for a missing email", async () => {
      const res = await app.request("/auth/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "secret" }),
      });
      expect(res.status).toBe(400);
      expect(nock.pendingMocks()).toHaveLength(0);
    });

    it("returns 400 for an invalid email format", async () => {
      const res = await app.request("/auth/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "not-an-email", password: "secret" }),
      });
      expect(res.status).toBe(400);
    });

    it("returns 400 for an empty password", async () => {
      const res = await app.request("/auth/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "user@example.com", password: "" }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe("PUT /auth/tokens", () => {
    it("returns a new token pair on a valid refresh token", async () => {
      const newTokens = { ...validTokenResponse, access_token: "new-access", refresh_token: "new-refresh" };

      supabaseAuth()
        .post("/auth/v1/token", { refresh_token: "old-refresh-token" })
        .query({ grant_type: "refresh_token" })
        .reply(200, newTokens);

      const res = await app.request("/auth/tokens", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: "old-refresh-token" }),
      });

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(newTokens);
      expect(nock.isDone()).toBe(true);
    });

    it("returns 401 when Supabase rejects the refresh token", async () => {
      supabaseAuth()
        .post("/auth/v1/token")
        .query({ grant_type: "refresh_token" })
        .reply(400, { error: "invalid_grant" });

      const res = await app.request("/auth/tokens", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: "expired-token" }),
      });

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: "Invalid or expired refresh token" });
    });

    it("returns 400 when refresh_token is missing", async () => {
      const res = await app.request("/auth/tokens", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /auth/tokens", () => {
    it("returns 204 and forwards the Authorization header to Supabase", async () => {
      const token = await makeJwt();

      nock(SUPABASE_URL)
        .post("/auth/v1/logout")
        .matchHeader("Authorization", `Bearer ${token}`)
        .reply(204);

      const res = await app.request("/auth/tokens", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(res.status).toBe(204);
      expect(nock.isDone()).toBe(true);
    });

    it("returns 401 when no token is provided", async () => {
      const res = await app.request("/auth/tokens", { method: "DELETE" });
      expect(res.status).toBe(401);
      expect(nock.pendingMocks()).toHaveLength(0);
    });
  });
});
