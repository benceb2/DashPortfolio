import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string | null>(localStorage.getItem("auth_token"));

  const isAuthenticated = computed(() => token.value !== null);

  function setToken(newToken: string): void {
    token.value = newToken;
    localStorage.setItem("auth_token", newToken);
  }

  function clearToken(): void {
    token.value = null;
    localStorage.removeItem("auth_token");
  }

  return { token, isAuthenticated, setToken, clearToken };
});
