import { ref, onMounted } from 'vue';
import { getProducts, getProduct } from '../api/products';
import { ApiError } from '../lib/http';
import type { Product } from '../api/schemas';

function messageFromError(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'No se pudieron cargar los productos.';
}

/** Formatea el precio (string del backend, ej. "199.99") a Lempiras. */
export function formatPrecio(precio: string): string {
  const value = Number(precio);
  if (!Number.isFinite(value)) return precio;
  return `L. ${value.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Composable para el catálogo del storefront. Carga GET /products al montar
 * y expone estado de carga/error y una función para recargar.
 */
export function useProductos() {
  const productos = ref<Product[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function load(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      productos.value = await getProducts();
    } catch (err) {
      error.value = messageFromError(err);
      productos.value = [];
    } finally {
      loading.value = false;
    }
  }

  onMounted(load);

  return { productos, loading, error, reload: load };
}

/** Composable para un producto individual (GET /products/{id}). */
export function useProducto(id: string) {
  const producto = ref<Product | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function load(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      producto.value = await getProduct(id);
    } catch (err) {
      error.value = messageFromError(err);
      producto.value = null;
    } finally {
      loading.value = false;
    }
  }

  onMounted(load);

  return { producto, loading, error, reload: load };
}
