import { defineStore } from "pinia";
import { ref } from "vue";
import type { Asset } from "@dashportfolio/types/asset";
import { api } from "../lib/api.js";

export const useAssetsStore = defineStore("assets", () => {
  const assets = ref<Asset[]>([]);
  const loading = ref(false);

  async function searchAssets(query: string): Promise<void> {
    loading.value = true;
    try {
      assets.value = await api.get<Asset[]>(`/v1/assets?q=${encodeURIComponent(query)}`);
    } finally {
      loading.value = false;
    }
  }

  return { assets, loading, searchAssets };
});
