import { request } from '../lib/http';
import {
  reporteClientesFrecuentesSchema,
  reporteVentasPorPeriodoSchema,
  reporteVentasPorSucursalSchema,
  reporteProductosMasVendidosSchema,
  reporteResumenSchema,
} from './schemas';

/** GET /reportes/clientes-frecuentes */
export function getClientesFrecuentes(desde: string, hasta: string): Promise<any> {
  return request('/reportes/clientes-frecuentes', reporteClientesFrecuentesSchema, {
    query: { desde, hasta },
    auth: true,
  });
}

/** GET /reportes/ventas-por-periodo */
export function getVentasPorPeriodo(desde: string, hasta: string): Promise<any> {
  return request('/reportes/ventas-por-periodo', reporteVentasPorPeriodoSchema, {
    query: { desde, hasta },
    auth: true,
  });
}

/** GET /reportes/ventas-sucursal */
export function getVentasPorSucursal(desde: string, hasta: string): Promise<any> {
  return request('/reportes/ventas-sucursal', reporteVentasPorSucursalSchema, {
    query: { desde, hasta },
    auth: true,
  });
}

/** GET /reportes/productos-mas-vendidos */
export function getProductosMasVendidos(desde: string, hasta: string): Promise<any> {
  return request('/reportes/productos-mas-vendidos', reporteProductosMasVendidosSchema, {
    query: { desde, hasta },
    auth: true,
  });
}

/** GET /reportes */
export function getResumenGeneral(desde: string, hasta: string): Promise<any> {
  return request('/reportes', reporteResumenSchema, {
    query: { desde, hasta },
    auth: true,
  });
}
