import { ref, onMounted } from 'vue';
import { getSucursales } from '../api/sucursales';
import type { Sucursal } from '../api/schemas';

/**
 * Composable para gestionar el listado de sucursales.
 */
export function useSucursales() {
  const sucursales = ref<Sucursal[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function load() {
    loading.value = true;
    error.value = null;
    try {
      sucursales.value = await getSucursales();
    } catch (err) {
      error.value = 'No se pudieron cargar las sucursales.';
      console.error(err);
    } finally {
      loading.value = false;
    }
  }

  return {
    sucursales,
    loading,
    error,
    load,
  };
}
