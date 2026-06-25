import { ref } from "vue";
import { getCais, getCai, createCai, getCaiRangos, createCaiRango } from "../api/cai";
import { ApiError } from "../lib/http";
import type { Cai, CaiRango } from "../api/schemas";

export function useCai() {
  const cais = ref<Cai[]>([]);
  const rangos = ref<CaiRango[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function loadCais() {
    loading.value = true;
    error.value = null;
    try {
      cais.value = await getCais();
    } catch (err) {
      error.value = err instanceof ApiError ? err.message : "No se pudieron cargar los CAI.";
    } finally {
      loading.value = false;
    }
  }

  async function loadRangos(estado?: "PENDIENTE" | "ACTIVO") {
    loading.value = true;
    error.value = null;
    try {
      rangos.value = await getCaiRangos(estado);
    } catch (err) {
      error.value = err instanceof ApiError ? err.message : "No se pudieron cargar los rangos de CAI.";
    } finally {
      loading.value = false;
    }
  }

  async function addCai(data: any): Promise<Cai | null> {
    loading.value = true;
    error.value = null;
    try {
      const nuevo = await createCai(data);
      cais.value.push(nuevo);
      return nuevo;
    } catch (err) {
      error.value = err instanceof ApiError ? err.message : "No se pudo crear el CAI.";
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function addRango(data: any): Promise<CaiRango | null> {
    loading.value = true;
    error.value = null;
    try {
      const nuevo = await createCaiRango(data);
      rangos.value.push(nuevo);
      return nuevo;
    } catch (err) {
      error.value = err instanceof ApiError ? err.message : "No se pudo crear el rango de CAI.";
      return null;
    } finally {
      loading.value = false;
    }
  }

  return {
    cais,
    rangos,
    loading,
    error,
    loadCais,
    loadRangos,
    addCai,
    addRango,
  };
}
