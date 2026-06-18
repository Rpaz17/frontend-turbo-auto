import { request } from '../lib/http';
import {
  facturaSchema,
  createFacturaDtoSchema,
  type Factura,
  type CreateFacturaDto,
} from './schemas';
import { z } from 'zod';

// GET /facturas y GET /facturas/{id} devuelven { data: {...} }
// POST /facturas devuelve la factura directamente (sin wrapper)
const facturaWrapperSchema = z.object({
  data: facturaSchema,
});
const facturasListWrapperSchema = z.object({
  data: z.union([facturaSchema, z.array(facturaSchema)]),
});

/** GET /facturas */
export async function getFacturas(params?: {
  cliente?: string;
  fecha?: string;
  numero?: string;
}): Promise<Factura[]> {
  const res = await request('/facturas', facturasListWrapperSchema, {
    query: params,
    auth: true,
  });
  return Array.isArray(res.data) ? res.data : [res.data];
}

/** POST /facturas */
export function generateFactura(factura: CreateFacturaDto): Promise<Factura> {
  return request('/facturas', facturaSchema, {
    method: 'POST',
    body: factura,
    auth: true,
  });
}

/** GET /facturas/{id} */
export async function getFacturaById(id: string): Promise<Factura> {
  const res = await request(`/facturas/${id}`, facturaWrapperSchema, { auth: true });
  return res.data;
}

/** GET /facturas/{id}/exportar */
export function exportFactura(id: string): Promise<string> {
  return request(`/facturas/${id}/exportar`, z.string(), { auth: true });
}

