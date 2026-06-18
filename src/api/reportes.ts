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

/** GET /reportes/clientes-frecuentes */
export async function getClientesFrecuentes(desde: string, hasta: string): Promise<any> {
  const res = await request('/reportes/clientes-frecuentes', wrap(reporteClientesFrecuentesSchema), {
    query: { desde, hasta },
    auth: true,
  });
  return unwrap(res);
}

/** GET /reportes/ventas-por-periodo */
export async function getVentasPorPeriodo(desde: string, hasta: string): Promise<any> {
  const res = await request('/reportes/ventas-por-periodo', wrap(reporteVentasPorPeriodoSchema.nullable()), {
    query: { desde, hasta },
    auth: true,
  });
  return unwrap(res);
}

/** GET /reportes/ventas-sucursal */
export async function getVentasPorSucursal(desde: string, hasta: string): Promise<any> {
  const res = await request('/reportes/ventas-sucursal', wrap(reporteVentasPorSucursalSchema), {
    query: { desde, hasta },
    auth: true,
  });
  return unwrap(res);
}

/** GET /reportes/productos-mas-vendidos */
export async function getProductosMasVendidos(desde: string, hasta: string): Promise<any> {
  const res = await request('/reportes/productos-mas-vendidos', wrap(reporteProductosMasVendidosSchema), {
    query: { desde, hasta },
    auth: true,
  });
  return unwrap(res);
}

/** GET /reportes */
export async function getResumenGeneral(desde: string, hasta: string): Promise<any> {
  const res = await request('/reportes', reporteResumenSchema, {
    query: { desde, hasta },
    auth: true,
  });
  return res.data;
}
