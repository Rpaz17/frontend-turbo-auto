import { request } from '../lib/http';
import {
  caiSchema,
  createCaiSchema,
  caiRangoSchema,
  createCaiRangoSchema,
  type Cai,
  type CaiRango,
} from './schemas';
import { z } from 'zod';

/** POST /cai */
export function createCai(cai: any): Promise<Cai> {
  return request('/cai', caiSchema, {
    method: 'POST',
    body: cai,
    auth: true,
  });
}

/** GET /cai */
export function getCais(): Promise<Cai[]> {
  return request('/cai', z.array(caiSchema), { auth: true });
}

/** GET /cai/{id} */
export function getCai(id: string): Promise<Cai> {
  return request(`/cai/${id}`, caiSchema, { auth: true });
}

/** GET /cai/rangos/list */
export function getCaiRangos(estado?: 'PENDIENTE' | 'ACTIVO'): Promise<CaiRango[]> {
  return request('/cai/rangos/list', z.array(caiRangoSchema), {
    query: { estado },
    auth: true,
  });
}

/** POST /cai/rangos */
export function createCaiRango(rango: any): Promise<CaiRango> {
  return request('/cai/rangos', caiRangoSchema, {
    method: 'POST',
    body: rango,
    auth: true,
  });
}
