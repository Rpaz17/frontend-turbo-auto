import { request } from '../lib/http';
import { inventarioSchema, type Inventario } from './schemas';

/**
 * GET /inventario?sucursal=&producto=
 * Stock de un producto en una sucursal específica.
 */
export function getInventario(
  sucursal: string,
  producto: string,
  signal?: AbortSignal,
): Promise<Inventario> {
  return request('/inventario', inventarioSchema, {
    query: { sucursal, producto },
    signal,
  });
}

/** PATCH /inventario/stock — crea o actualiza el stock exacto. */
export function setInventario(
  sucursal: string,
  producto: string,
  cantidad: number,
): Promise<Inventario> {
  return request('/inventario/stock', inventarioSchema, {
    method: 'PATCH',
    body: { sucursal, producto, cantidad },
    auth: true,
  });
}
