<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.js";
import { ApiError } from "../lib/api.js";

const router = useRouter();
const authStore = useAuthStore();

const email = ref("");
const password = ref("");
const errorMsg = ref<string | null>(null);
const loading = ref(false);

async function handleLogin(): Promise<void> {
  errorMsg.value = null;
  loading.value = true;
  try {
    await authStore.login(email.value, password.value);
    await router.push({ name: "dashboard" });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      errorMsg.value = "Invalid email or password.";
    } else {
      errorMsg.value = "Something went wrong. Please try again.";
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <q-page class="flex flex-center">
    <q-card style="width: 360px" class="q-pa-md">
      <q-card-section>
        <div class="text-h6">Sign in</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="handleLogin" class="q-gutter-md">
          <q-input
            v-model="email"
            type="email"
            label="Email"
            outlined
            dense
            autocomplete="email"
            :disable="loading"
          />
          <q-input
            v-model="password"
            type="password"
            label="Password"
            outlined
            dense
            autocomplete="current-password"
            :disable="loading"
          />
          <q-banner v-if="errorMsg" class="text-negative bg-negative-light" dense>
            {{ errorMsg }}
          </q-banner>
          <q-btn
            type="submit"
            label="Sign in"
            color="primary"
            class="full-width"
            :loading="loading"
          />
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>
