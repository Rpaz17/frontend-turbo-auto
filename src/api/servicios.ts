import { request } from '../lib/http';
import {
  servicioListSchema,
  servicioSchema,
  type CreateServicioApi,
  type ServicioApi,
  type UpdateServicioApi,
} from './schemas';
import { z } from 'zod';

/** GET /servicios — catálogo de servicios y mano de obra. */
export function getServicios(signal?: AbortSignal): Promise<ServicioApi[]> {
  return request('/servicios', servicioListSchema, { signal });
}

/** POST /servicios */
export function createServicio(servicio: CreateServicioApi): Promise<ServicioApi> {
  return request('/servicios', servicioSchema, {
    method: 'POST',
    body: servicio,
    auth: true,
  });
}

/** PATCH /servicios/{id} */
export function updateServicio(id: string, servicio: UpdateServicioApi): Promise<ServicioApi> {
  return request(`/servicios/${id}`, servicioSchema, {
    method: 'PATCH',
    body: servicio,
    auth: true,
  });
}

/** DELETE /servicios/{id} */
export function deleteServicio(id: string): Promise<{ message: string }> {
  return request(`/servicios/${id}`, z.object({ message: z.string() }), {
    method: 'DELETE',
    auth: true,
  });
}
