import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { api } from "../lib/api.js";

interface TokenPayload {
  sub: string;
  email?: string;
  exp: number;
}

interface AuthUser {
  id: string;
  email: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

function decodeJwtPayload(token: string): TokenPayload {
  const part = token.split(".")[1];
  if (!part) throw new Error("Malformed JWT");
  const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(atob(base64)) as TokenPayload;
}

function userFromToken(token: string): AuthUser {
  const payload = decodeJwtPayload(token);
  return { id: payload.sub, email: payload.email ?? "" };
}

export const useAuthStore = defineStore("auth", () => {
  const accessToken = ref<string | null>(localStorage.getItem("auth_token"));
  const refreshToken = ref<string | null>(localStorage.getItem("auth_refresh_token"));

  const isAuthenticated = computed(() => accessToken.value !== null);

  const user = computed<AuthUser | null>(() =>
    accessToken.value ? userFromToken(accessToken.value) : null,
  );

  function setTokens(tokens: TokenResponse): void {
    accessToken.value = tokens.access_token;
    refreshToken.value = tokens.refresh_token;
    localStorage.setItem("auth_token", tokens.access_token);
    localStorage.setItem("auth_refresh_token", tokens.refresh_token);
  }

  function clearTokens(): void {
    accessToken.value = null;
    refreshToken.value = null;
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_refresh_token");
  }

  async function login(email: string, password: string): Promise<void> {
    const tokens = await api.post<TokenResponse>("/auth/tokens", { email, password });
    setTokens(tokens);
  }

  async function logout(): Promise<void> {
    try {
      await api.delete("/auth/tokens");
    } finally {
      clearTokens();
    }
  }

  async function refresh(): Promise<boolean> {
    const token = refreshToken.value;
    if (!token) return false;
    try {
      const tokens = await api.put<TokenResponse>("/auth/tokens", { refresh_token: token });
      setTokens(tokens);
      return true;
    } catch {
      clearTokens();
      return false;
    }
  }

  return { accessToken, isAuthenticated, user, login, logout, refresh };
});
