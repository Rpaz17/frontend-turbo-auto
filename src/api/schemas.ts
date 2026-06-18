import { z } from "zod";

// ── Auth ────────────────────────────────────────────────────────────────────
export const authCredentialsSchema = z.object({
  username: z.string().min(1, "El usuario es obligatorio"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});
export type AuthCredentials = z.infer<typeof authCredentialsSchema>;

export const loginResponseSchema = z.object({
  access_token: z.string(),
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

export const authUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string(),
  admin: z.boolean(),
});
export type AuthUser = z.infer<typeof authUserSchema>;

export const createAuthUserSchema = z.object({
  username: z.string(),
  password: z.string(),
  displayName: z.string(),
  admin: z.boolean().optional(),
});
export type CreateAuthUser = z.infer<typeof createAuthUserSchema>;

export const updateAuthUserSchema = z.object({
  username: z.string().optional(),
  password: z.string().optional(),
  displayName: z.string().optional(),
});
export type UpdateAuthUser = z.infer<typeof updateAuthUserSchema>;

// ── Redes Sociales ───────────────────────────────────────────────────────────
export const redSocialSchema = z.object({
  id: z.number(),
  nombre: z.string(),
  tipo: z.string(),
  url: z.string(),
  activo: z.boolean(),
});
export type RedSocial = z.infer<typeof redSocialSchema>;

export const createRedSocialSchema = z.object({
  name: z.string(),
  url: z.string(),
  active: z.boolean().optional(),
});
export type CreateRedSocial = z.infer<typeof createRedSocialSchema>;

export const updateRedSocialSchema = createRedSocialSchema.partial();

// ── Sucursales ───────────────────────────────────────────────────────────────
export const sucursalSchema = z.object({
  id: z.union([z.string(), z.number()]),
  nombre: z.string(),
  direccion: z.string(),
});
export type Sucursal = z.infer<typeof sucursalSchema>;

export const sucursalResponseSchema = z.object({
  data: z.union([sucursalSchema, z.array(sucursalSchema)]),
  message: z.string(),
});

export const createSucursalSchema = z.object({
  nombre: z.string(),
  direccion: z.string(),
});
export type CreateSucursal = z.infer<typeof createSucursalSchema>;

export const updateSucursalSchema = createSucursalSchema.partial();

// ── Clientes ─────────────────────────────────────────────────────────────────
export const clientSchema = z.object({
  id: z.string(),
  rtn: z.string(),
  nombre: z.string(),
  telefono: z.string(),
  direccion: z.string(),
  created_at: z.string(),
  activo: z.boolean(),
});
export type Client = z.infer<typeof clientSchema>;

export const clientResponseSchema = z.array(
  z.union([clientSchema, z.array(clientSchema)]),
);

export const createClientSchema = z.object({
  rtn: z.string(),
  nombre: z.string(),
  telefono: z.string(),
  direccion: z.string(),
});
export type CreateClient = z.infer<typeof createClientSchema>;

export const updateClientSchema = z.object({
  rtn: z.string().optional(),
  nombre: z.string().optional(),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  activo: z.boolean().optional(),
});
export type UpdateClient = z.infer<typeof updateClientSchema>;

// ── Facturas ─────────────────────────────────────────────────────────────────
export const facturaProductoSchema = z.object({
  id: z.string(),
  producto_id: z.string(),
  factura_id: z.string(),
  cantidad: z.coerce.number(),
  nombre: z.string(),
  precio: z.string(),
  isv: z.string().nullable().optional(),
});
export const facturaServicioSchema = z.object({
  id: z.string().optional(),
  factura_id: z.string().optional(),
  descripcion: z.string(),
  // El backend devuelve total como string ("80"); coerce lo convierte a number.
  total: z.coerce.number(),
  nota_interna: z.string().nullable().optional(),
});
export type FacturaServicio = z.infer<typeof facturaServicioSchema>;

export type FacturaProducto = z.infer<typeof facturaProductoSchema>;

export const facturaSchema = z.object({
  id: z.string(),
  numero_factura: z.string(),
  cai_id: z.string(),
  fecha_emision: z.string(),
  num_compra_exenta: z.string().nullable().optional(),
  num_exonerado: z.string().nullable().optional(),
  numero_sag: z.string().nullable().optional(),
  sucursal_id: z.string(),
  autor_id: z.string().nullable().optional(),
  cliente_id: z.string(),
  // El backend devuelve null cuando la factura es de contado.
  rtn_cliente: z.string().nullable().optional(),
  cliente: clientSchema.optional(),
  productos: z.array(facturaProductoSchema).optional(),
  servicios: z.array(facturaServicioSchema).optional(),
});
export type Factura = z.infer<typeof facturaSchema>;

export const createFacturaDtoSchema = z.object({
  sucursal_id: z.string(),
  cliente_id: z.string(),
  autor_id: z.string(),
  rtn_cliente: z.string().optional(),
  num_compra_exenta: z.string().optional(),
  num_exonerado: z.string().optional(),
  numero_sag: z.string().optional(),
  productos: z.array(
    z.object({
      producto_id: z.string(),
      cantidad: z.number(),
    }),
  ).optional(),
  servicios: z.array(facturaServicioSchema).optional(),
});
export type CreateFacturaDto = z.infer<typeof createFacturaDtoSchema>;

// ── Products ──────────────────────────────────────────────────────────────────
export const productSchema = z.object({
  id: z.string(),
  imagen_id: z.string().nullable().optional(),
  tipo_producto_id: z.string().nullable().optional(),
  proveedor_id: z.string().nullable().optional(),
  codigo: z.string(),
  nombre: z.string(),
  precio: z.string(),
  isv: z.string().nullable().optional(),
  activo: z.boolean(),
});
export type Product = z.infer<typeof productSchema>;

export const productListSchema = z.array(productSchema);

export const productImageUrlSchema = z.object({
  url: z.string(),
});
export type ProductImageUrl = z.infer<typeof productImageUrlSchema>;

export const createProductSchema = z.object({
  tipo_producto_id: z.string().optional(),
  proveedor_id: z.string().optional(),
  codigo: z.string(),
  nombre: z.string(),
  precio: z.string(),
  isv: z.string().optional(),
  activo: z.boolean().optional(),
});
export type CreateProduct = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial();

// ── Inventario ────────────────────────────────────────────────────────────────
export const inventarioSchema = z.object({
  sucursal_id: z.string(),
  producto_id: z.string(),
  cantidad: z.number(),
});
export type Inventario = z.infer<typeof inventarioSchema>;

export const inventarioSucursalSchema = z.object({
  sucursal_id: z.string(),
  sucursal_nombre: z.string().nullable().optional(),
  cantidad: z.number(),
});
export type InventarioSucursal = z.infer<typeof inventarioSucursalSchema>;

export const inventarioProductoSchema = z.array(inventarioSucursalSchema);

// ── Reseñas ───────────────────────────────────────────────────────────────────
export const resenaSchema = z.object({
  id: z.string(),
  producto_id: z.string(),
  correo: z.string(),
  cuerpo: z.string(),
  valor: z.number(),
  created_at: z.string(),
});
export type Resena = z.infer<typeof resenaSchema>;

export const resenaListSchema = z.array(resenaSchema);

// ── Reportes ──────────────────────────────────────────────────────────────────
export const reporteClientesFrecuentesSchema = z.array(
  z.object({
    cliente_id: z.string().optional(),
    id: z.string().optional(),
    nombre: z.string(),
    rtn: z.string().nullable().optional(),
    total_facturas: z.number().optional(),
    total_compras: z.number().optional(),
    monto_total: z.union([z.string(), z.number()]).optional(),
  }),
);

export const reporteVentasPorPeriodoSchema = z.object({
  facturas: z.array(z.any()).optional(),
  resumen: z.any().optional(),
  total_ventas: z.number().optional(),
  monto_total: z.number().optional(),
});

export const reporteVentasPorSucursalSchema = z.array(
  z.object({
    sucursal_id: z.string(),
    sucursal_nombre: z.string(),
    total_facturas: z.number().optional(),
    total_ventas: z.number().optional(),
    monto_total: z.union([z.string(), z.number()]),
  }),
);

export const reporteProductosMasVendidosSchema = z.array(
  z.object({
    id: z.string().optional(),
    nombre: z.string(),
    cantidad_total: z.number().optional(),
    total_vendido: z.number().optional(),
  }),
);

export const reporteResumenSchema = z.object({
  data: z.object({
    clientes_frecuentes: z.array(z.any()),
    ventas_por_periodo: z.any(),
    productos_mas_vendidos: z.array(z.any()),
  }),
  message: z.string(),
});

// ── CAI ───────────────────────────────────────────────────────────────────────
export const caiSchema = z.object({
  id: z.string(),
  descripcion: z.string(),
  codigo_cai: z.string(),
  fecha_vencimiento: z.string(),
  fecha_emision: z.string(),
});
export type Cai = z.infer<typeof caiSchema>;

export const createCaiSchema = z.object({
  descripcion: z.string(),
  codigo_cai: z.string(),
  fecha_vencimiento: z.string(),
  fecha_emision: z.string(),
});

export const caiRangoSchema = z.object({
  id: z.string(),
  cai_id: z.string(),
  sucursal_id: z.number(),
  establecimiento: z.string(),
  punto_emision: z.string(),
  tipo_documento: z.string(),
  rango_inicio: z.number(),
  rango_final: z.number(),
  correlativo_actual: z.number(),
  estado: z.string(),
  fecha_activacion: z.string().nullable().optional(),
  fecha_cierre: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type CaiRango = z.infer<typeof caiRangoSchema>;

export const createCaiRangoSchema = z.object({
  cai_id: z.string(),
  sucursal_id: z.number(),
  establecimiento: z.string(),
  punto_emision: z.string(),
  tipo_documento: z.string(),
  rango_inicio: z.number(),
  rango_final: z.number(),
});