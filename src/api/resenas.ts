import { request } from '../lib/http';
import { resenaListSchema, type Resena } from './schemas';

/** GET /resenas/{productId} — reseñas de un producto (más recientes primero). */
export function getResenas(productId: string, signal?: AbortSignal): Promise<Resena[]> {
  return request(`/resenas/${productId}`, resenaListSchema, { signal });
}
