import { request } from '../lib/http';
import {
  redSocialSchema,
  createRedSocialSchema,
  updateRedSocialSchema,
  type RedSocial,
  type CreateRedSocial,
} from './schemas';
import { z } from 'zod';

/** GET /ajustes/redes-sociales */
export function getRedesSociales(): Promise<RedSocial[]> {
  return request('/ajustes/redes-sociales', z.array(redSocialSchema), { auth: true });
}

/** GET /ajustes/redes-sociales/activas */
export function getRedesSocialesActivas(): Promise<RedSocial[]> {
  return request('/ajustes/redes-sociales/activas', z.array(redSocialSchema));
}

/** GET /ajustes/redes-sociales/{id} */
export function getRedSocial(id: number): Promise<RedSocial> {
  return request(`/ajustes/redes-sociales/${id}`, redSocialSchema, { auth: true });
}

/** POST /ajustes/redes-sociales */
export function createRedSocial(red: CreateRedSocial): Promise<RedSocial> {
  return request('/ajustes/redes-sociales', redSocialSchema, {
    method: 'POST',
    body: red,
    auth: true,
  });
}

/** PATCH /ajustes/redes-sociales/{id} */
export function updateRedSocial(id: number, red: Partial<CreateRedSocial>): Promise<RedSocial> {
  return request(`/ajustes/redes-sociales/${id}`, redSocialSchema, {
    method: 'PATCH',
    body: red,
    auth: true,
  });
}

/** PATCH /ajustes/redes-sociales/{id}/delete (Soft Delete) */
export function deleteRedSocial(id: number): Promise<RedSocial> {
  return request(`/ajustes/redes-sociales/${id}/delete`, redSocialSchema, {
    method: 'PATCH',
    auth: true,
  });
}
