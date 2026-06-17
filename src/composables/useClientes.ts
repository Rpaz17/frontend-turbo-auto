import { ref } from "vue";
import { getClients } from "../api/clientes";
import type { Client } from "../api/schemas";

export function useClientes() {
  const clientes = ref<Client[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function load() {
    loading.value = true;
    error.value = null;
    try {
      clientes.value = await getClients();
    } catch (err) {
      error.value = "Error al cargar los clientes";
      console.error(err);
    } finally {
      loading.value = false;
    }
  }

  return {
    clientes,
    loading,
    error,
    load,
  };
}
