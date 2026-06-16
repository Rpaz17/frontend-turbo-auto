import { request } from '../lib/http';
import { setToken, clearToken } from '../lib/token';
import {
  authCredentialsSchema,
  loginResponseSchema,
  authUserSchema,
  createAuthUserSchema,
  updateAuthUserSchema,
  type AuthCredentials,
  type LoginResponse,
  type AuthUser,
  type CreateAuthUser,
  type UpdateAuthUser,
} from './schemas';
import { z } from 'zod';

/** POST /auth/login */
export async function login(credentials: AuthCredentials): Promise<LoginResponse> {
  const body = authCredentialsSchema.parse(credentials);
  const res = await request('/auth/login', loginResponseSchema, { method: 'POST', body });
  setToken(res.access_token);
  return res;
}

/** Cierra la sesión local eliminando el JWT. */
export function logout(): void {
  clearToken();
}

/** POST /auth/register */
export function register(user: CreateAuthUser): Promise<AuthUser> {
  return request('/auth/register', authUserSchema, {
    method: 'POST',
    body: user,
    auth: true,
  });
}

/** GET /auth/users */
export function getUsers(): Promise<AuthUser[]> {
  return request('/auth/users', z.array(authUserSchema), { auth: true });
}

/** PATCH /auth/user/{id} */
export function updateUser(id: string, user: UpdateAuthUser): Promise<AuthUser> {
  return request(`/auth/user/${id}`, authUserSchema, {
    method: 'PATCH',
    body: user,
    auth: true,
  });
}

/** GET /auth/username?username=... */
export function getUsernameAvailable(username: string): Promise<{ available: boolean }> {
  return request('/auth/username', z.object({ available: z.boolean() }), {
    query: { username },
  });
}
