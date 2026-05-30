import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createApp } from "../app.js";
import { makeJwt, TEST_USER_ID } from "../test/helpers.js";

vi.mock("../db/client.js", () => ({
  db: {
    selectFrom: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn(),
        }),
      }),
    }),
  },
}));

const { db } = await import("../db/client.js");

const fakeUser = {
  id: TEST_USER_ID,
  display_name: "Test User",
  base_currency: "USD",
  created_at: new Date("2024-01-01T00:00:00Z"),
  updated_at: new Date("2024-01-01T00:00:00Z"),
};

function mockExecuteTakeFirst(value: unknown) {
  const executeTakeFirst = vi.fn().mockResolvedValue(value);
  (db.selectFrom as ReturnType<typeof vi.fn>).mockReturnValue({
    select: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({ executeTakeFirst }),
    }),
  });
  return executeTakeFirst;
}

const app = createApp();

describe("GET /v1/users/me", () => {
  let token: string;

  beforeEach(async () => {
    token = await makeJwt();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 with no token", async () => {
    const res = await app.request("/v1/users/me");
    expect(res.status).toBe(401);
  });

  it("returns 401 with an expired token", async () => {
    const expired = await makeJwt({ exp: Math.floor(Date.now() / 1000) - 60 });
    const res = await app.request("/v1/users/me", {
      headers: { Authorization: `Bearer ${expired}` },
    });
    expect(res.status).toBe(401);
  });

  it("returns 404 when the user row does not exist", async () => {
    mockExecuteTakeFirst(undefined);
    const res = await app.request("/v1/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "User not found" });
  });

  it("returns the user profile for a valid token", async () => {
    mockExecuteTakeFirst(fakeUser);
    const res = await app.request("/v1/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      id: TEST_USER_ID,
      displayName: "Test User",
      baseCurrency: "USD",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    });
  });
});
