import { request } from '../lib/http';
import {
  reporteClientesFrecuentesSchema,
  reporteVentasPorPeriodoSchema,
  reporteVentasPorSucursalSchema,
  reporteProductosMasVendidosSchema,
  reporteResumenSchema,
} from './schemas';
import { z } from 'zod';

const wrap = <T extends z.ZodTypeAny>(schema: T) => z.union([schema, z.object({ data: schema, message: z.string().optional(), total: z.number().optional() })]);

function unwrap<T>(value: T | { data: T }): T {
  return value && typeof value === 'object' && 'data' in value ? value.data : value;
}

function dateRangeQuery(desde: string, hasta: string) {
  return {
    desde: `${desde}T00:00:00.000`,
    hasta: `${hasta}T23:59:59.999`,
  };
}

/** GET /reportes/clientes-frecuentes */
export async function getClientesFrecuentes(desde: string, hasta: string): Promise<any> {
  const res = await request('/reportes/clientes-frecuentes', wrap(reporteClientesFrecuentesSchema), {
    query: dateRangeQuery(desde, hasta),
    auth: true,
  });
  return unwrap(res);
}

/** GET /reportes/ventas-por-periodo */
export async function getVentasPorPeriodo(desde: string, hasta: string): Promise<any> {
  const res = await request('/reportes/ventas-por-periodo', wrap(reporteVentasPorPeriodoSchema.nullable()), {
    query: dateRangeQuery(desde, hasta),
    auth: true,
  });
  return unwrap(res);
}

/** GET /reportes/ventas-sucursal */
export async function getVentasPorSucursal(desde: string, hasta: string): Promise<any> {
  const res = await request('/reportes/ventas-sucursal', wrap(reporteVentasPorSucursalSchema), {
    query: dateRangeQuery(desde, hasta),
    auth: true,
  });
  return unwrap(res);
}

/** GET /reportes/productos-mas-vendidos */
export async function getProductosMasVendidos(desde: string, hasta: string): Promise<any> {
  const res = await request('/reportes/productos-mas-vendidos', wrap(reporteProductosMasVendidosSchema), {
    query: dateRangeQuery(desde, hasta),
    auth: true,
  });
  return unwrap(res);
}

/** GET /reportes */
export async function getResumenGeneral(desde: string, hasta: string): Promise<any> {
  const res = await request('/reportes', reporteResumenSchema, {
    query: dateRangeQuery(desde, hasta),
    auth: true,
  });
  return res.data;
}
