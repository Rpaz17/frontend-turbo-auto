import { request } from "../lib/http";
import {
  clientSchema,
  clientResponseSchema,
  createClientSchema,
  updateClientSchema,
  type Client,
  type CreateClient,
  type UpdateClient,
} from "./schemas";

/** GET /clientes */
export async function getClients(): Promise<Client[]> {
  const res = await request("/clientes", clientResponseSchema, { auth: true });
  return res as Client[];
}

/** POST /clientes */
export function createClient(client: CreateClient): Promise<any> {
  return request("/clientes", clientResponseSchema, {
    method: "POST",
    body: client,
    auth: true,
  });
}

/** GET /clientes/{id} */
export function getClient(id: string): Promise<any> {
  return request(`/clientes/${id}`, clientResponseSchema, { auth: true });
}

/** PATCH /clientes/{id} */
export function updateClient(id: string, client: UpdateClient): Promise<any> {
  return request(`/clientes/${id}`, clientResponseSchema, {
    method: "PATCH",
    body: client,
    auth: true,
  });
}
