import { request, ApiError } from '../lib/http';
import {
  productSchema,
  productListSchema,
  productImageUrlSchema,
  inventarioProductoSchema,
  createProductSchema,
  updateProductSchema,
  type Product,
  type ProductImageUrl,
  type InventarioSucursal,
  type CreateProduct,
  type UpdateProduct,
} from './schemas';
import { z } from 'zod';

/** GET /products — lista todos los productos del catálogo. */
export function getProducts(signal?: AbortSignal): Promise<Product[]> {
  return request('/products', productListSchema, { signal });
}

/** GET /products/{id} — un producto por su ID. */
export function getProduct(id: string, signal?: AbortSignal): Promise<Product> {
  return request(`/products/${id}`, productSchema, { signal });
}

/** POST /products — crea un nuevo producto. */
export function createProduct(product: CreateProduct): Promise<Product> {
  return request('/products', productSchema, {
    method: 'POST',
    body: product,
    auth: true,
  });
}

/** PUT /products/{id} — actualiza un producto. */
export function updateProduct(id: string, product: UpdateProduct): Promise<Product> {
  return request(`/products/${id}`, productSchema, {
    method: 'PUT',
    body: product,
    auth: true,
  });
}

/** DELETE /products/{id} — elimina un producto. */
export function deleteProduct(id: string): Promise<{ message: string }> {
  return request(`/products/${id}`, z.object({ message: z.string() }), {
    method: 'DELETE',
    auth: true,
  });
}

/** GET /products/{id}/image — URL de la imagen del producto. */
export function getProductImageUrl(id: string, signal?: AbortSignal): Promise<ProductImageUrl> {
  return request(`/products/${id}/image`, productImageUrlSchema, { signal });
}

/** POST /products/{productId}/image — sube imagen del producto. */
export async function uploadProductImage(productId: string, file: File): Promise<any> {
  const formData = new FormData();
  formData.append('image', file);

  // Axios maneja FormData automáticamente si lo pasamos en el body
  return request(`/products/${productId}/image`, z.any(), {
    method: 'POST',
    body: formData,
    auth: true,
  });
}
