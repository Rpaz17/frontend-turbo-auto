import { ref, computed } from 'vue';
import { getResenas } from '../api/resenas';
import { ApiError } from '../lib/http';
import type { Resena } from '../api/schemas';

/**
 * Composable para las reseñas de un producto en su página individual.
 * Se invoca `load(productId)` al abrir el detalle.
 */
export function useResenas() {
  const resenas = ref<Resena[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const promedio = computed(() => {
    if (!resenas.value.length) return 0;
    return resenas.value.reduce((acc, r) => acc + r.valor, 0) / resenas.value.length;
  });

  async function load(productId: string): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      resenas.value = await getResenas(productId);
    } catch (err) {
      error.value = err instanceof ApiError ? err.message : 'No se pudieron cargar las reseñas.';
      resenas.value = [];
    } finally {
      loading.value = false;
    }
  }

  function reset(): void {
    resenas.value = [];
    error.value = null;
  }

  return { resenas, promedio, loading, error, load, reset };
}
