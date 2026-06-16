import { ref, computed } from "vue";
import { getSucursales } from "../api/sucursales";
import { getInventario } from "../api/inventario";
import { ApiError } from "../lib/http";
import type { InventarioSucursal } from "../api/schemas";

/**
 * Composable para el stock de un producto por sucursal en su página individual.
 * Dado que el backend no tiene un endpoint que devuelva todas las sucursales juntas
 * para un producto, este composable coordina las llamadas individuales.
 */
export function useInventarioProducto() {
  const sucursales = ref<InventarioSucursal[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const disponibles = computed(() =>
    sucursales.value.filter((s) => s.cantidad > 0),
  );
  const hayStock = computed(() => disponibles.value.length > 0);

  async function load(productId: string): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      // 1. Obtener todas las sucursales disponibles
      const listaSucursales = await getSucursales();
      
      // 2. Consultar el stock para cada sucursal en paralelo
      const promesas = listaSucursales.map(async (s) => {
        try {
          const inv = await getInventario(String(s.id), productId);
          return {
            sucursal_id: String(s.id),
            sucursal_nombre: s.nombre,
            cantidad: inv.cantidad,
          };
        } catch (err) {
          // Si una sucursal no tiene registro de este producto (404), asumimos 0
          if (err instanceof ApiError && err.status === 404) {
            return {
              sucursal_id: String(s.id),
              sucursal_nombre: s.nombre,
              cantidad: 0,
            };
          }
          throw err;
        }
      });

      sucursales.value = await Promise.all(promesas);
    } catch (err) {
      error.value =
        err instanceof ApiError
          ? err.message
          : "No se pudo consultar el inventario.";
      sucursales.value = [];
    } finally {
      loading.value = false;
    }
  }

  function reset(): void {
    sucursales.value = [];
    error.value = null;
  }

  return { sucursales, disponibles, hayStock, loading, error, load, reset };
}
