import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import type { ZodType } from 'zod';
import { getToken, clearToken } from './token';

// Base URL de la API. Se configura con VITE_API_URL (.env). Si no se define,
// cae a localhost para desarrollo.
export const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/** Instancia de axios preconfigurada */
const api = axios.create({
  baseURL: BASE_URL,
});

function extractMessage(data: unknown, fallback: string): string {
  if (data && typeof data === 'object' && 'message' in data) {
    const message = (data as { message: unknown }).message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string') return message;
  }
  return fallback;
}

type Query = Record<string, string | number | boolean | null | undefined>;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Query;
  // Si true, agrega el header Authorization con el JWT (cuando exista).
  auth?: boolean;
  signal?: AbortSignal;
}

/**
 * Realiza una petición HTTP usando Axios y valida la respuesta con un schema zod.
 * Lanza ApiError en respuestas no exitosas (incluye status y mensaje del backend).
 */
export async function request<T>(
  path: string,
  schema: ZodType<T>,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, query, auth = false, signal } = options;

  const config: AxiosRequestConfig = {
    method,
    url: path,
    params: query,
    data: body,
    signal,
    headers: {},
  };

  if (auth) {
    const token = getToken();
    if (token) {
      config.headers!['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const response = await api.request(config);
    return schema.parse(response.data);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status ?? 500;
      const data = err.response?.data;
      
      // Token inválido/expirado: limpiamos la sesión.
      if (status === 401) clearToken();
      
      throw new ApiError(status, extractMessage(data, err.message), data);
    }
    
    // Si ya es un ApiError (raro aquí, pero por si acaso) o un error de Zod
    throw err;
  }
}
