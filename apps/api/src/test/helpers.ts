import { SignJWT } from "jose";
import nock from "nock";

export const TEST_USER_ID = "00000000-0000-0000-0000-000000000001";

const JWT_SECRET = new TextEncoder().encode(process.env["SUPABASE_JWT_SECRET"]);

export async function makeJwt(
  overrides: { sub?: string; exp?: number } = {},
): Promise<string> {
  return new SignJWT({ sub: overrides.sub ?? TEST_USER_ID })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(overrides.exp ?? Math.floor(Date.now() / 1000) + 3600)
    .sign(JWT_SECRET);
}

export const SUPABASE_URL = "https://fake.supabase.co";

export const supabaseAuth = (): nock.Scope =>
  nock(SUPABASE_URL).matchHeader("apikey", process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "");

export const validTokenResponse = {
  access_token: "access-abc",
  refresh_token: "refresh-abc",
  expires_in: 3600,
  token_type: "bearer",
} as const;
