import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { AuthError } from "@supabase/supabase-js";

const mockSignInWithPassword = vi.fn();
const mockSignOut = vi.fn();
let authStateCallback: ((event: string, session: unknown) => void) | null = null;
const mockUnsubscribe = vi.fn();

vi.mock("../lib/supabase.js", () => ({
  supabase: {
    auth: {
      onAuthStateChange: (cb: (event: string, session: unknown) => void) => {
        authStateCallback = cb;
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
      },
      signInWithPassword: mockSignInWithPassword,
      signOut: mockSignOut,
    },
  },
}));

const fakeUser = { id: "usr_123", email: "test@example.com" };

async function importStore() {
  const { useAuthStore } = await import("./auth.js");
  return useAuthStore();
}

describe("useAuthStore", () => {
  beforeEach(() => {
    vi.resetModules();
    authStateCallback = null;
    mockSignInWithPassword.mockReset();
    mockSignOut.mockReset();
    mockUnsubscribe.mockReset();
    setActivePinia(createPinia());
  });

  it("resolves ready and sets user on INITIAL_SESSION with a session", async () => {
    const store = await importStore();
    authStateCallback!("INITIAL_SESSION", { user: fakeUser });
    await store.ready;
    expect(store.user).toEqual(fakeUser);
    expect(store.isAuthenticated).toBe(true);
  });

  it("resolves ready and leaves user null on INITIAL_SESSION with no session", async () => {
    const store = await importStore();
    authStateCallback!("INITIAL_SESSION", null);
    await store.ready;
    expect(store.user).toBeNull();
    expect(store.isAuthenticated).toBe(false);
  });

  it("updates user on SIGNED_IN", async () => {
    const store = await importStore();
    authStateCallback!("INITIAL_SESSION", null);
    authStateCallback!("SIGNED_IN", { user: fakeUser });
    expect(store.user).toEqual(fakeUser);
  });

  it("clears user on SIGNED_OUT", async () => {
    const store = await importStore();
    authStateCallback!("INITIAL_SESSION", { user: fakeUser });
    authStateCallback!("SIGNED_OUT", null);
    expect(store.user).toBeNull();
  });

  it("login calls signInWithPassword and does not throw on success", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });
    const store = await importStore();
    await expect(store.login("a@b.com", "pass")).resolves.toBeUndefined();
    expect(mockSignInWithPassword).toHaveBeenCalledWith({ email: "a@b.com", password: "pass" });
  });

  it("login throws the AuthError on failure", async () => {
    const error = new AuthError("Invalid login credentials", 400);
    mockSignInWithPassword.mockResolvedValue({ error });
    const store = await importStore();
    await expect(store.login("a@b.com", "wrong")).rejects.toThrow("Invalid login credentials");
  });

  it("logout calls signOut", async () => {
    mockSignOut.mockResolvedValue({});
    const store = await importStore();
    await store.logout();
    expect(mockSignOut).toHaveBeenCalledOnce();
  });

  it("dispose unsubscribes from auth state changes", async () => {
    const store = await importStore();
    store.dispose();
    expect(mockUnsubscribe).toHaveBeenCalledOnce();
  });
});
