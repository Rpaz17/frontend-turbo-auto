import { request } from '../lib/http';
import {
  sucursalSchema,
  sucursalResponseSchema,
  createSucursalSchema,
  updateSucursalSchema,
  type Sucursal,
  type CreateSucursal,
  type UpdateSucursal,
} from './schemas';
import { z } from 'zod';

/** 
 * GET /sucursales 
 * Se eliminó { auth: true } ya que el endpoint ahora es público.
 */
export async function getSucursales(): Promise<Sucursal[]> {
  const res = await request('/sucursales', sucursalResponseSchema);
  return Array.isArray(res.data) ? res.data : [res.data];
}

/** POST /sucursales */
export function createSucursal(sucursal: CreateSucursal): Promise<any> {
  return request('/sucursales', sucursalResponseSchema, {
    method: 'POST',
    body: sucursal,
    auth: true,
  });
}

/** POST /sucursales/{id} (Update) */
export function updateSucursal(id: string | number, sucursal: UpdateSucursal): Promise<any> {
  return request(`/sucursales/${id}`, sucursalResponseSchema, {
    method: 'POST',
    body: sucursal,
    auth: true,
  });
}

/** DELETE /sucursales/{id} */
export function deleteSucursal(id: string | number): Promise<any> {
  return request(`/sucursales/${id}`, sucursalResponseSchema, {
    method: 'DELETE',
    auth: true,
  });
}
