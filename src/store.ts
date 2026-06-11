import { reactive, watch } from 'vue';

export type EstadoProducto = 'critico' | 'advertencia' | 'disponible' | 'sobrestock';

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

export interface Producto {
  id: string;
  nombre: string;
  tipo: string;
  stockPorSucursal: Record<string, number>;
  precio: string;
  proveedor: string;
  estado?: EstadoProducto;
  descripcion?: string;
  reseñas?: { nombre: string; calificacion: number; comentario: string; fecha: string }[];
}

export interface Servicio {
  id: string;
  descripcion: string;
  categoria: string;
  precio: number;
  empleado: string;
  notas?: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  ciudad: string;
  rtn: string;
  totalCompras: string;
  facturas: number;
  ultimaCompra: string;
  estado: 'Activo' | 'Inactivo';
  historial: { id: string; fecha: string; monto: string; productos: string }[];
}

export interface Canal {
  id: number;
  tipo: string;
  identificador: string;
  url: string;
  activo: boolean;
}

export interface VentaItem {
  productoId: string;
  nombre: string;
  categoria: string;
  cantidad: number;
  precio: number;
}

export interface Venta {
  id: string;
  fecha: string;
  clienteId: string;
  cliente: string;
  sucursalId: string;
  total: number;
  unidades: number;
  items: VentaItem[];
}

export interface Umbrales {
  critico: number;
  advertencia: number;
  sobrestock: number;
  diasSinMovimiento: number;
}

interface AppState {
  sucursales: SucursalBase[];
  productos: Producto[];
  servicios: Servicio[];
  clientes: Cliente[];
  canales: Canal[];
  umbrales: Umbrales;
  ventas: Venta[];
}

const STORAGE_KEY = 'turbo-auto-fm504-state-v3';

export const categoriasProducto = ['Todos los tipos', 'Filtros', 'Frenos', 'Motor', 'Eléctrico', 'Suspensión', 'Lubricantes', 'Baterías'];
export const categoriasServicio = ['Todas las categorías', 'Instalación', 'Mantenimiento', 'Suspensión', 'Eléctrico', 'General'];

const sucursalesIniciales: SucursalBase[] = [
  { id: 'SUC-001', nombre: 'Sucursal Central', direccion: 'Col. Kennedy, Av. La Paz #145, Tegucigalpa', telefono: '+504 2235-1234', encargado: 'María Reyes', productos: 0, valorStock: 'L. 0.00', estado: 'Activa', stock: [] },
  { id: 'SUC-002', nombre: 'Sucursal Norte', direccion: 'Blvd. del Norte #890, San Pedro Sula', telefono: '+504 2553-4567', encargado: 'Jorge Álvarez', productos: 0, valorStock: 'L. 0.00', estado: 'Activa', stock: [] },
  { id: 'SUC-003', nombre: 'Sucursal Sur', direccion: 'Col. Villa Real, 3a Calle SO, Choluteca', telefono: '+504 2882-6789', encargado: 'Ana Mejía', productos: 0, valorStock: 'L. 0.00', estado: 'Activa', stock: [] },
];

const productosIniciales: Producto[] = [
  { id: 'PRD-001', nombre: 'Filtro de aceite 5W-30', tipo: 'Filtros', stockPorSucursal: { 'SUC-001': 2, 'SUC-002': 0, 'SUC-003': 8 }, precio: 'L. 85.00', proveedor: 'Fram Honduras', descripcion: 'Filtro de aceite de alto rendimiento para motores de gasolina y diésel.', reseñas: [{ nombre: 'Cliente anónimo', calificacion: 5, comentario: 'Excelente calidad, llegó rápido.', fecha: '28/05/2024' }, { nombre: 'Taller Morales', calificacion: 4, comentario: 'Buen producto, cumple con lo esperado.', fecha: '15/05/2024' }] },
  { id: 'PRD-002', nombre: 'Pastillas de freno Bosch DB1170', tipo: 'Frenos', stockPorSucursal: { 'SUC-001': 8, 'SUC-002': 12, 'SUC-003': 5 }, precio: 'L. 280.00', proveedor: 'Bosch HN', descripcion: 'Pastillas de freno de alta calidad marca Bosch. Excelente rendimiento en frenado y larga durabilidad.', reseñas: [{ nombre: 'Cliente anónimo', calificacion: 5, comentario: 'Las mejores pastillas que he comprado.', fecha: '01/06/2024' }] },
  { id: 'PRD-003', nombre: 'Bujías NGK Platinum BKR5E', tipo: 'Motor', stockPorSucursal: { 'SUC-001': 45, 'SUC-002': 62, 'SUC-003': 28 }, precio: 'L. 95.00', proveedor: 'NGK Honduras', descripcion: 'Bujías NGK de platino para máximo rendimiento del motor. Mejora la eficiencia de combustible.', reseñas: [] },
  { id: 'PRD-004', nombre: 'Batería Willard 12V 60Ah', tipo: 'Baterías', stockPorSucursal: { 'SUC-001': 18, 'SUC-002': 9, 'SUC-003': 14 }, precio: 'L. 1,250.00', proveedor: 'Willard SA', descripcion: 'Batería de alta potencia para vehículos livianos y pesados. Garantía de 18 meses.', reseñas: [{ nombre: 'Roberto M.', calificacion: 5, comentario: 'Batería de excelente calidad.', fecha: '30/05/2024' }] },
  { id: 'PRD-005', nombre: 'Aceite Motor Castrol GTX 20W-50', tipo: 'Lubricantes', stockPorSucursal: { 'SUC-001': 0, 'SUC-002': 4, 'SUC-003': 11 }, precio: 'L. 185.00', proveedor: 'Castrol HN', descripcion: 'Aceite de motor mineral para motores de gasolina y GLP. Protege y extiende la vida del motor.', reseñas: [] },
  { id: 'PRD-006', nombre: 'Amortiguador Monroe 911264', tipo: 'Suspensión', stockPorSucursal: { 'SUC-001': 22, 'SUC-002': 18, 'SUC-003': 7 }, precio: 'L. 950.00', proveedor: 'Monroe Honduras', descripcion: 'Amortiguador Monroe de gas para vehículos. Mejora la estabilidad y confort de manejo.', reseñas: [{ nombre: 'Taller Auto', calificacion: 5, comentario: 'Producto original, muy buena calidad.', fecha: '25/05/2024' }] },
  { id: 'PRD-007', nombre: 'Alternador Denso 12V 70A', tipo: 'Eléctrico', stockPorSucursal: { 'SUC-001': 6, 'SUC-002': 3, 'SUC-003': 9 }, precio: 'L. 2,800.00', proveedor: 'Denso Regional', descripcion: 'Alternador de alto rendimiento compatible con vehículos livianos.', reseñas: [] },
  { id: 'PRD-008', nombre: 'Correa de distribución Gates', tipo: 'Motor', stockPorSucursal: { 'SUC-001': 14, 'SUC-002': 7, 'SUC-003': 19 }, precio: 'L. 320.00', proveedor: 'Gates HN', descripcion: 'Correa de distribución Gates resistente a altas temperaturas.', reseñas: [] },
  { id: 'PRD-009', nombre: 'Líquido de frenos DOT 4', tipo: 'Frenos', stockPorSucursal: { 'SUC-001': 26, 'SUC-002': 18, 'SUC-003': 12 }, precio: 'L. 145.00', proveedor: 'Bosch HN', descripcion: 'Líquido de frenos DOT 4 para sistemas hidráulicos.', reseñas: [] },
  { id: 'PRD-010', nombre: 'Filtro de aire Toyota Hilux', tipo: 'Filtros', stockPorSucursal: { 'SUC-001': 15, 'SUC-002': 21, 'SUC-003': 6 }, precio: 'L. 210.00', proveedor: 'Toyota Parts HN', descripcion: 'Filtro de aire para Toyota Hilux.', reseñas: [] },
  { id: 'PRD-011', nombre: 'Sensor oxígeno universal', tipo: 'Eléctrico', stockPorSucursal: { 'SUC-001': 4, 'SUC-002': 2, 'SUC-003': 1 }, precio: 'L. 780.00', proveedor: 'Denso Regional', descripcion: 'Sensor de oxígeno universal.', reseñas: [] },
  { id: 'PRD-012', nombre: 'Kit de clutch Exedy', tipo: 'Motor', stockPorSucursal: { 'SUC-001': 10, 'SUC-002': 6, 'SUC-003': 3 }, precio: 'L. 3,200.00', proveedor: 'Exedy Honduras', descripcion: 'Kit de clutch completo para vehículos seleccionados.', reseñas: [] },
];

const serviciosIniciales: Servicio[] = [
  { id: 'SRV-001', descripcion: 'Instalación de frenos completo', categoria: 'Instalación', precio: 450, empleado: 'Cualquier mecánico' },
  { id: 'SRV-002', descripcion: 'Cambio de aceite y filtro', categoria: 'Mantenimiento', precio: 200, empleado: 'Cualquier mecánico' },
  { id: 'SRV-003', descripcion: 'Alineación y balanceo', categoria: 'Suspensión', precio: 350, empleado: 'Técnico especializado' },
  { id: 'SRV-004', descripcion: 'Diagnóstico electrónico', categoria: 'Eléctrico', precio: 300, empleado: 'Técnico especializado' },
  { id: 'SRV-005', descripcion: 'Reparación de suspensión', categoria: 'Suspensión', precio: 800, empleado: 'Mecánico senior' },
  { id: 'SRV-006', descripcion: 'Instalación de batería', categoria: 'Instalación', precio: 150, empleado: 'Cualquier mecánico' },
  { id: 'SRV-007', descripcion: 'Cambio de bujías', categoria: 'Mantenimiento', precio: 180, empleado: 'Cualquier mecánico' },
  { id: 'SRV-008', descripcion: 'Mano de obra general', categoria: 'General', precio: 250, empleado: 'Cualquier mecánico' },
  { id: 'SRV-009', descripcion: 'Limpieza de inyectores', categoria: 'Mantenimiento', precio: 620, empleado: 'Técnico especializado' },
  { id: 'SRV-010', descripcion: 'Instalación de alternador', categoria: 'Instalación', precio: 500, empleado: 'Mecánico senior' },
];

const clientesIniciales: Cliente[] = [
  { id: 'CLI-001', nombre: 'Roberto Mejía', telefono: '+504 9987-2341', email: 'roberto@example.com', ciudad: 'Tegucigalpa', rtn: '0801-1985-12345', totalCompras: 'L. 24,500', facturas: 12, ultimaCompra: '01/06/2024', estado: 'Activo', historial: [{ id: 'F-2024-0891', fecha: '01/06/2024', monto: 'L. 3,450', productos: 'Filtros, bujías' }] },
  { id: 'CLI-002', nombre: 'Constructora HN S.A.', telefono: '+504 2234-5678', email: 'compras@constructoraHN.com', ciudad: 'San Pedro Sula', rtn: '0501-2001-00892', totalCompras: 'L. 185,400', facturas: 48, ultimaCompra: '01/06/2024', estado: 'Activo', historial: [{ id: 'F-2024-0890', fecha: '01/06/2024', monto: 'L. 12,800', productos: 'Varios repuestos' }] },
  { id: 'CLI-003', nombre: 'Taller Morales & Asociados', telefono: '+504 9812-3456', email: 'taller.morales@gmail.com', ciudad: 'Tegucigalpa', rtn: '0801-1979-65432', totalCompras: 'L. 67,800', facturas: 31, ultimaCompra: '31/05/2024', estado: 'Activo', historial: [{ id: 'F-2024-0889', fecha: '31/05/2024', monto: 'L. 7,200', productos: 'Amortiguadores' }] },
  { id: 'CLI-004', nombre: 'Carlos Pineda', telefono: '+504 9765-4321', email: 'cpineda@email.com', ciudad: 'La Ceiba', rtn: '0601-1992-22334', totalCompras: 'L. 8,900', facturas: 7, ultimaCompra: '31/05/2024', estado: 'Activo', historial: [] },
  { id: 'CLI-005', nombre: 'Transportes del Norte', telefono: '+504 2245-6789', email: 'admin@transnorte.hn', ciudad: 'San Pedro Sula', rtn: '0502-2005-11234', totalCompras: 'L. 312,000', facturas: 89, ultimaCompra: '30/05/2024', estado: 'Inactivo', historial: [] },
];

const canalesIniciales: Canal[] = [
  { id: 1, tipo: 'WhatsApp', identificador: '+504 9900-1234', url: 'https://wa.me/50499001234', activo: true },
  { id: 2, tipo: 'Instagram', identificador: '@turboautofm504', url: 'https://instagram.com/turboautofm504', activo: true },
  { id: 3, tipo: 'Facebook', identificador: 'Turbo Auto F&M 504', url: 'https://facebook.com/turboautofm504', activo: true },
  { id: 4, tipo: 'Teléfono', identificador: '+504 2235-5678', url: 'tel:+50422355678', activo: false },
];

const ventasIniciales: Venta[] = [
  { id: 'F-2024-0831', fecha: '2024-01-14', clienteId: 'CLI-001', cliente: 'Roberto Mejía', sucursalId: 'SUC-001', total: 38500, unidades: 142, items: [{ productoId: 'PRD-001', nombre: 'Filtro de aceite 5W-30', categoria: 'Filtros', cantidad: 52, precio: 85 }, { productoId: 'PRD-003', nombre: 'Bujías NGK Platinum BKR5E', categoria: 'Motor', cantidad: 90, precio: 95 }] },
  { id: 'F-2024-0842', fecha: '2024-02-18', clienteId: 'CLI-002', cliente: 'Constructora HN S.A.', sucursalId: 'SUC-002', total: 42000, unidades: 166, items: [{ productoId: 'PRD-002', nombre: 'Pastillas de freno Bosch DB1170', categoria: 'Frenos', cantidad: 66, precio: 280 }, { productoId: 'PRD-010', nombre: 'Filtro de aire Toyota Hilux', categoria: 'Filtros', cantidad: 100, precio: 210 }] },
  { id: 'F-2024-0850', fecha: '2024-03-09', clienteId: 'CLI-003', cliente: 'Taller Morales & Asociados', sucursalId: 'SUC-001', total: 35800, unidades: 132, items: [{ productoId: 'PRD-006', nombre: 'Amortiguador Monroe 911264', categoria: 'Suspensión', cantidad: 30, precio: 950 }, { productoId: 'PRD-005', nombre: 'Aceite Motor Castrol GTX 20W-50', categoria: 'Lubricantes', cantidad: 102, precio: 185 }] },
  { id: 'F-2024-0864', fecha: '2024-04-21', clienteId: 'CLI-005', cliente: 'Transportes del Norte', sucursalId: 'SUC-002', total: 51200, unidades: 186, items: [{ productoId: 'PRD-004', nombre: 'Batería Willard 12V 60Ah', categoria: 'Baterías', cantidad: 24, precio: 1250 }, { productoId: 'PRD-002', nombre: 'Pastillas de freno Bosch DB1170', categoria: 'Frenos', cantidad: 80, precio: 280 }, { productoId: 'PRD-009', nombre: 'Líquido de frenos DOT 4', categoria: 'Frenos', cantidad: 82, precio: 145 }] },
  { id: 'F-2024-0875', fecha: '2024-05-28', clienteId: 'CLI-002', cliente: 'Constructora HN S.A.', sucursalId: 'SUC-003', total: 48700, unidades: 175, items: [{ productoId: 'PRD-012', nombre: 'Kit de clutch Exedy', categoria: 'Motor', cantidad: 9, precio: 3200 }, { productoId: 'PRD-007', nombre: 'Alternador Denso 12V 70A', categoria: 'Eléctrico', cantidad: 7, precio: 2800 }, { productoId: 'PRD-001', nombre: 'Filtro de aceite 5W-30', categoria: 'Filtros', cantidad: 159, precio: 85 }] },
  { id: 'F-2024-0891', fecha: '2024-06-01', clienteId: 'CLI-001', cliente: 'Roberto Mejía', sucursalId: 'SUC-001', total: 63400, unidades: 248, items: [{ productoId: 'PRD-003', nombre: 'Bujías NGK Platinum BKR5E', categoria: 'Motor', cantidad: 114, precio: 95 }, { productoId: 'PRD-008', nombre: 'Correa de distribución Gates', categoria: 'Motor', cantidad: 40, precio: 320 }, { productoId: 'PRD-011', nombre: 'Sensor oxígeno universal', categoria: 'Eléctrico', cantidad: 94, precio: 780 }] },
  { id: 'F-2024-0910', fecha: '2024-07-04', clienteId: 'CLI-004', cliente: 'Carlos Pineda', sucursalId: 'SUC-003', total: 58900, unidades: 190, items: [{ productoId: 'PRD-005', nombre: 'Aceite Motor Castrol GTX 20W-50', categoria: 'Lubricantes', cantidad: 120, precio: 185 }, { productoId: 'PRD-006', nombre: 'Amortiguador Monroe 911264', categoria: 'Suspensión', cantidad: 70, precio: 950 }] },
];

function defaultState(): AppState {
  return {
    sucursales: structuredCloneSafe(sucursalesIniciales),
    productos: structuredCloneSafe(productosIniciales),
    servicios: structuredCloneSafe(serviciosIniciales),
    clientes: structuredCloneSafe(clientesIniciales),
    canales: structuredCloneSafe(canalesIniciales),
    umbrales: { critico: 5, advertencia: 10, sobrestock: 200, diasSinMovimiento: 30 },
    ventas: structuredCloneSafe(ventasIniciales),
  };
}

function structuredCloneSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function loadState(): AppState {
  if (typeof window === 'undefined') return defaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}

export const store = reactive<AppState>(loadState());

export function persistNow() {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

if (typeof window !== 'undefined') {
  watch(store, persistNow, { deep: true });
}

export function resetDemoData() {
  const next = defaultState();
  Object.assign(store, next);
  normalizeAllProductStocks();
  refreshSucursalSummaries();
  persistNow();
}

export function normalizeAllProductStocks() {
  store.productos.forEach((producto) => {
    store.sucursales.forEach((sucursal) => {
      if (typeof producto.stockPorSucursal[sucursal.id] !== 'number') producto.stockPorSucursal[sucursal.id] = 0;
    });
    Object.keys(producto.stockPorSucursal).forEach((id) => {
      if (!store.sucursales.some((s) => s.id === id)) delete producto.stockPorSucursal[id];
    });
  });
}

export function parseMoney(value: string | number): number {
  if (typeof value === 'number') return value;
  const parsed = Number(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatMoney(value: number): string {
  return `L. ${value.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function totalStock(producto: Producto): number {
  return Object.values(producto.stockPorSucursal).reduce((a, b) => a + Number(b || 0), 0);
}

export function getEstadoProducto(producto: Producto): EstadoProducto {
  const total = totalStock(producto);
  if (total <= store.umbrales.critico) return 'critico';
  if (total <= store.umbrales.advertencia) return 'advertencia';
  if (total >= store.umbrales.sobrestock) return 'sobrestock';
  return 'disponible';
}

export function nextId(prefix: string, values: { id: string }[]) {
  const max = values.reduce((acc, item) => {
    const n = Number(item.id.split('-')[1]);
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}

export function addProducto(data: Omit<Producto, 'id'>) {
  normalizeAllProductStocks();
  store.productos.push({ ...data, id: nextId('PRD', store.productos), reseñas: data.reseñas ?? [] });
  normalizeAllProductStocks();
  refreshSucursalSummaries();
}

export function updateProducto(id: string, data: Partial<Producto>) {
  const idx = store.productos.findIndex((p) => p.id === id);
  if (idx >= 0) {
    store.productos[idx] = { ...store.productos[idx], ...data };
    normalizeAllProductStocks();
    refreshSucursalSummaries();
  }
}

export function deleteProducto(id: string) {
  const idx = store.productos.findIndex((p) => p.id === id);
  if (idx >= 0) store.productos.splice(idx, 1);
  refreshSucursalSummaries();
}

export function addServicio(data: Omit<Servicio, 'id'>) {
  store.servicios.push({ ...data, id: nextId('SRV', store.servicios) });
}

export function updateServicio(id: string, data: Partial<Servicio>) {
  const idx = store.servicios.findIndex((s) => s.id === id);
  if (idx >= 0) store.servicios[idx] = { ...store.servicios[idx], ...data };
}

export function deleteServicio(id: string) {
  const idx = store.servicios.findIndex((s) => s.id === id);
  if (idx >= 0) store.servicios.splice(idx, 1);
}

export function addSucursal(data: Pick<SucursalBase, 'nombre' | 'direccion' | 'telefono' | 'encargado'>) {
  const nueva: SucursalBase = { ...data, id: nextId('SUC', store.sucursales), productos: 0, valorStock: 'L. 0.00', estado: 'Activa', stock: [] };
  store.sucursales.push(nueva);
  store.productos.forEach((producto) => { producto.stockPorSucursal[nueva.id] = 0; });
  refreshSucursalSummaries();
}

export function updateSucursal(id: string, data: Partial<SucursalBase>) {
  const idx = store.sucursales.findIndex((s) => s.id === id);
  if (idx >= 0) store.sucursales[idx] = { ...store.sucursales[idx], ...data };
  refreshSucursalSummaries();
}

export function deleteSucursal(id: string) {
  const idx = store.sucursales.findIndex((s) => s.id === id);
  if (idx >= 0) store.sucursales.splice(idx, 1);
  store.productos.forEach((p) => delete p.stockPorSucursal[id]);
  refreshSucursalSummaries();
}

export function addCliente(data: Pick<Cliente, 'nombre' | 'telefono' | 'email' | 'ciudad' | 'rtn'>) {
  store.clientes.push({ id: nextId('CLI', store.clientes), ...data, totalCompras: 'L. 0.00', facturas: 0, ultimaCompra: '-', estado: 'Activo', historial: [] });
}

export function updateCliente(id: string, data: Partial<Cliente>) {
  const idx = store.clientes.findIndex((c) => c.id === id);
  if (idx >= 0) store.clientes[idx] = { ...store.clientes[idx], ...data };
}

export function deleteCliente(id: string) {
  const idx = store.clientes.findIndex((c) => c.id === id);
  if (idx >= 0) store.clientes.splice(idx, 1);
}

export function addCanal(data: Omit<Canal, 'id'>) {
  store.canales.push({ ...data, id: Date.now() });
}

export function updateCanal(id: number, data: Partial<Canal>) {
  const idx = store.canales.findIndex((c) => c.id === id);
  if (idx >= 0) store.canales[idx] = { ...store.canales[idx], ...data };
}

export function deleteCanal(id: number) {
  const idx = store.canales.findIndex((c) => c.id === id);
  if (idx >= 0) store.canales.splice(idx, 1);
}

export function setUmbrales(data: Partial<Umbrales>) {
  store.umbrales = { ...store.umbrales, ...data };
  refreshSucursalSummaries();
}

export function getSucursalCategoriaStock(sucursalId: string) {
  const map = new Map<string, number>();
  store.productos.forEach((producto) => {
    const qty = Number(producto.stockPorSucursal[sucursalId] || 0);
    if (qty > 0) map.set(producto.tipo, (map.get(producto.tipo) ?? 0) + qty);
  });
  return Array.from(map.entries()).map(([categoria, cantidad]) => ({ categoria, cantidad })).sort((a, b) => b.cantidad - a.cantidad);
}

export function getSucursalValorStock(sucursalId: string) {
  return store.productos.reduce((acc, producto) => acc + Number(producto.stockPorSucursal[sucursalId] || 0) * parseMoney(producto.precio), 0);
}

export function refreshSucursalSummaries() {
  normalizeAllProductStocks();
  store.sucursales.forEach((sucursal) => {
    const stock = getSucursalCategoriaStock(sucursal.id);
    sucursal.stock = stock;
    sucursal.productos = stock.reduce((a, b) => a + b.cantidad, 0);
    sucursal.valorStock = formatMoney(getSucursalValorStock(sucursal.id));
  });
}

export function getProductosCatalogo() {
  normalizeAllProductStocks();
  return store.productos.map((producto) => {
    const disponibilidad: Record<string, boolean> = {};
    store.sucursales.forEach((sucursal) => {
      disponibilidad[sucursal.nombre.replace('Sucursal ', '')] = Number(producto.stockPorSucursal[sucursal.id] || 0) > 0;
    });
    return {
      ...producto,
      categoria: producto.tipo,
      disponibilidad,
      reseñas: producto.reseñas ?? [],
      descripcion: producto.descripcion || 'Producto registrado en inventario con disponibilidad por sucursal.',
    };
  });
}

export function getVentasEnRango(desde: string, hasta: string) {
  const min = desde ? new Date(desde) : new Date('1900-01-01');
  const max = hasta ? new Date(hasta) : new Date('2999-12-31');
  return store.ventas.filter((venta) => {
    const fecha = new Date(venta.fecha);
    return fecha >= min && fecha <= max;
  });
}

export function ventasPorMes(ventas: Venta[]) {
  const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const map = new Map<string, number>();
  ventas.forEach((venta) => {
    const d = new Date(venta.fecha);
    const label = labels[d.getUTCMonth()];
    map.set(label, (map.get(label) ?? 0) + venta.total);
  });
  return labels.filter((m) => map.has(m)).map((mes) => ({ label: mes, value: map.get(mes) ?? 0 }));
}

export function ventasPorCategoria(ventas: Venta[]) {
  const colors = ['#38BDF8', '#FDBA74', '#F87171', '#86EFAC', '#C4B5FD', '#818CF8', '#22C55E'];
  const map = new Map<string, number>();
  ventas.forEach((venta) => {
    venta.items.forEach((item) => {
      map.set(item.categoria, (map.get(item.categoria) ?? 0) + item.cantidad * item.precio);
    });
  });
  const total = Array.from(map.values()).reduce((a, b) => a + b, 0) || 1;
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).map(([label, amount], i) => ({ label, value: Math.round((amount / total) * 100), amount, color: colors[i % colors.length] }));
}

export function productosMasVendidos(ventas: Venta[]) {
  const map = new Map<string, { nombre: string; vendidos: number; ingresos: number }>();
  ventas.forEach((venta) => venta.items.forEach((item) => {
    const current = map.get(item.productoId) ?? { nombre: item.nombre, vendidos: 0, ingresos: 0 };
    current.vendidos += item.cantidad;
    current.ingresos += item.cantidad * item.precio;
    map.set(item.productoId, current);
  }));
  return Array.from(map.values()).sort((a, b) => b.vendidos - a.vendidos).slice(0, 5);
}

export function clientesFrecuentes(ventas: Venta[]) {
  const map = new Map<string, { nombre: string; compras: number; monto: number }>();
  ventas.forEach((venta) => {
    const current = map.get(venta.clienteId) ?? { nombre: venta.cliente, compras: 0, monto: 0 };
    current.compras += 1;
    current.monto += venta.total;
    map.set(venta.clienteId, current);
  });
  return Array.from(map.values()).sort((a, b) => b.monto - a.monto).slice(0, 5);
}

normalizeAllProductStocks();
refreshSucursalSummaries();
