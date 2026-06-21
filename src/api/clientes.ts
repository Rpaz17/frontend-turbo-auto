import { request } from "../lib/http";
import {
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
  return Array.isArray(res.data) ? res.data : [res.data];
}

/** POST /clientes */
export async function createClient(client: CreateClient): Promise<Client> {
  const res = await request("/clientes", clientResponseSchema, {
    method: "POST",
    body: client,
    auth: true,
  });
  return Array.isArray(res.data) ? res.data[0] : res.data;
}

/** GET /clientes/{id} */
export async function getClient(id: string): Promise<Client> {
  const res = await request(`/clientes/${id}`, clientResponseSchema, { auth: true });
  return Array.isArray(res.data) ? res.data[0] : res.data;
}

/** PATCH /clientes/{id} */
export async function updateClient(id: string, client: UpdateClient): Promise<Client> {
  const res = await request(`/clientes/${id}`, clientResponseSchema, {
    method: "PATCH",
    body: client,
    auth: true,
  });
  return Array.isArray(res.data) ? res.data[0] : res.data;
}