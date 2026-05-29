import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase.js";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const isAuthenticated = computed(() => user.value !== null);

  // Resolves once INITIAL_SESSION has fired so router guards can await it.
  let resolveReady!: () => void;
  const ready = new Promise<void>((resolve) => {
    resolveReady = resolve;
  });

  // onAuthStateChange emits INITIAL_SESSION automatically after the client
  // initialises from storage — no separate getSession() call needed.
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    user.value = session?.user ?? null;
    if (event === "INITIAL_SESSION") {
      resolveReady();
    }
  });

  function dispose(): void {
    subscription.unsubscribe();
  }

  async function login(email: string, password: string): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  return { user, isAuthenticated, ready, login, logout, dispose };
});
