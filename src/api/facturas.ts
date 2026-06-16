import { request } from '../lib/http';
import {
  facturaSchema,
  facturaResponseSchema,
  createFacturaDtoSchema,
  type Factura,
  type CreateFacturaDto,
} from './schemas';
import { z } from 'zod';

/** GET /facturas */
export async function getFacturas(params?: {
  cliente?: string;
  fecha?: string;
  numero?: string;
}): Promise<Factura[]> {
  const res = await request('/facturas', facturaResponseSchema, {
    query: params,
    auth: true,
  });
  return Array.isArray(res.data) ? res.data : [res.data];
}

/** POST /facturas */
export function generateFactura(factura: CreateFacturaDto): Promise<any> {
  return request('/facturas', facturaResponseSchema, {
    method: 'POST',
    body: factura,
    auth: true,
  });
}

/** GET /facturas/{id} */
export function getFacturaById(id: string): Promise<any> {
  return request(`/facturas/${id}`, facturaResponseSchema, { auth: true });
}

/** GET /facturas/{id}/exportar */
export function exportFactura(id: string): Promise<string> {
  return request(`/facturas/${id}/exportar`, z.string(), { auth: true });
}
