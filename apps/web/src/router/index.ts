import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth.js";

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      component: () => import("../layouts/MainLayout.vue"),
      children: [
        {
          path: "",
          name: "dashboard",
          component: () => import("../views/DashboardView.vue"),
          meta: { requiresAuth: true },
        },
        {
          path: "login",
          name: "login",
          component: () => import("../views/LoginView.vue"),
        },
      ],
    },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  // Wait for INITIAL_SESSION to fire before making auth decisions, so a hard
  // reload to a protected route doesn't falsely redirect to /login.
  await auth.ready;
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: "login" };
  }
  if (to.name === "login" && auth.isAuthenticated) {
    return { name: "dashboard" };
  }
});
