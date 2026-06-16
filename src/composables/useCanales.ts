import { ref } from "vue";
import { getRedesSocialesActivas } from "../api/ajustes";
import type { RedSocial } from "../api/schemas";

/**
 * Composable para gestionar los canales de comunicación (redes sociales activas).
 */
export function useCanales() {
  const canales = ref<RedSocial[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function load() {
    loading.value = true;
    error.value = null;
    try {
      canales.value = await getRedesSocialesActivas();
    } catch (err) {
      error.value = "No se pudieron cargar los canales de comunicación.";
      console.error(err);
    } finally {
      loading.value = false;
    }
  }

  return {
    canales,
    loading,
    error,
    load,
  };
}
