import { defineStore } from "pinia";
import { ref } from "vue";
import type { Holding, CustomAsset } from "@dashportfolio/types/holding";
import { api } from "../lib/api.js";

export const useHoldingsStore = defineStore("holdings", () => {
  const holdings = ref<Holding[]>([]);
  const customAssets = ref<CustomAsset[]>([]);
  const loading = ref(false);

  async function fetchHoldings(): Promise<void> {
    loading.value = true;
    try {
      holdings.value = await api.get<Holding[]>("/v1/holdings");
    } finally {
      loading.value = false;
    }
  }

  return { holdings, customAssets, loading, fetchHoldings };
});
