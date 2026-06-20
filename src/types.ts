export interface SucursalBase {
  id: string;
  nombre: string;
  direccion: string;
  telefono: string;
  encargado: string;
  usuarioCliente: string;
  correoUsuario: string;
  productos: number;
  valorStock: string;
  estado: string;
  stock: { categoria: string; cantidad: number }[];
}
