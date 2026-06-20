import { ref } from 'vue';
import type { Sucursal } from '../api/schemas';

const sucursales = ref<Sucursal[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

export function useSharedSucursales() {
  const setSucursales = (next: Sucursal[]) => {
    sucursales.value = next;
  };

  return {
    sucursales,
    loading,
    error,
    setSucursales,
  };
}
