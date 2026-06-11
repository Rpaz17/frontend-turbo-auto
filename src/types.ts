export type Page = "panel" | "inventario" | "ventas" | "clientes" | "reportes" | "sucursales" | "configuracion" | "storefront";

export interface SucursalBase {
  id: string;
  nombre: string;
  direccion: string;
  telefono: string;
  encargado: string;
  productos: number;
  valorStock: string;
  estado: string;
  stock: { categoria: string; cantidad: number }[];
}
