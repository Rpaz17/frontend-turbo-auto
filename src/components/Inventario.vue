<script lang="tsx">
import { defineComponent, onMounted, ref } from 'vue';
import { Search, Plus, Edit2, Trash2, X, Package, AlertTriangle, CheckCircle, ChevronDown, Wrench } from 'lucide-vue-next';
import { store, categoriasProducto, categoriasServicio, getEstadoProducto, totalStock, parseMoney, formatMoney, refreshSucursalSummaries, type Producto, type Servicio, type SucursalBase } from '../store';
import { getProducts, createProduct as apiCreateProduct, updateProduct as apiUpdateProduct, deleteProduct as apiDeleteProduct } from '../api/products';
import { getSucursales } from '../api/sucursales';
import { getInventario, setInventarioStock } from '../api/inventario';
import { getServicios, createServicio as apiCreateServicio, updateServicio as apiUpdateServicio, deleteServicio as apiDeleteServicio } from '../api/servicios';
import type { Product, ServicioApi, Sucursal } from '../api/schemas';
import { ApiError } from '../lib/http';

const ITEMS_PER_PAGE = 8;

const estadoLabel = {
  critico: { text: 'Stock crítico', color: '#F87171', bg: '#FEF2F2', icon: AlertTriangle },
  advertencia: { text: 'Advertencia', color: '#FDBA74', bg: '#FFF7ED', icon: AlertTriangle },
  disponible: { text: 'Disponible', color: '#4ADE80', bg: '#F0FDF4', icon: CheckCircle },
  sobrestock: { text: 'Sobrestock', color: '#38BDF8', bg: '#F0F9FF', icon: CheckCircle },
};

interface ProductoForm {
  nombre: string;
  tipo: string;
  stockPorSucursal: Record<string, string>;
  precio: string;
  proveedor: string;
  descripcion: string;
}

interface ServicioForm {
  descripcion: string;
  categoria: string;
  precio: string;
  notas: string;
}

const formServicioVacio: ServicioForm = { descripcion: '', categoria: '', precio: '', notas: '' };

function formVacio(): ProductoForm {
  const stockPorSucursal: Record<string, string> = {};
  store.sucursales.forEach((s) => { stockPorSucursal[s.id] = ''; });
  return { nombre: '', tipo: '', stockPorSucursal, precio: '', proveedor: '', descripcion: '' };
}

function errorMessage(err: unknown, fallback: string) {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

function mapSucursalApi(sucursal: Sucursal): SucursalBase {
  const id = String(sucursal.id);
  const current = store.sucursales.find((s) => s.id === id);
  return {
    id,
    nombre: sucursal.nombre,
    direccion: sucursal.direccion,
    telefono: current?.telefono ?? '',
    encargado: current?.encargado ?? '',
    usuarioCliente: current?.usuarioCliente ?? '',
    correoUsuario: current?.correoUsuario ?? '',
    productos: current?.productos ?? 0,
    valorStock: current?.valorStock ?? 'L. 0.00',
    estado: current?.estado ?? 'Activa',
    stock: current?.stock ?? [],
    cai: current?.cai ?? store.sucursales[0].cai,
  };
}

function mapProductoApi(producto: Product): Producto {
  const stockPorSucursal: Record<string, number> = {};
  store.sucursales.forEach((s) => { stockPorSucursal[s.id] = 0; });
  producto.inventarios?.forEach((inv) => { stockPorSucursal[String(inv.sucursal_id)] = inv.cantidad; });

  return {
    id: producto.id,
    nombre: producto.nombre,
    tipo: producto.tipo_producto?.tipo ?? producto.tipo_producto_id ?? 'General',
    stockPorSucursal,
    precio: formatMoney(parseMoney(producto.precio)),
    proveedor: producto.proveedor?.nombre ?? '',
    descripcion: '',
    reseñas: [],
  };
}

async function cargarStockProducto(producto: Producto) {
  await Promise.all(
    store.sucursales.map(async (sucursal) => {
      try {
        const inventario = await getInventario(sucursal.id, producto.id);
        producto.stockPorSucursal[sucursal.id] = inventario.cantidad;
      } catch (err) {
        if (!(err instanceof ApiError && err.status === 404)) throw err;
        producto.stockPorSucursal[sucursal.id] = 0;
      }
    }),
  );
}

function mapServicioApi(servicio: ServicioApi): Servicio {
  return {
    id: servicio.id,
    descripcion: servicio.descripcion,
    categoria: servicio.categoria,
    precio: servicio.precio,
    notas: servicio.notas,
  };
}

function sucursalLabel(nombre: string) {
  return nombre.replace('Sucursal ', '');
}

function paginate<T>(items: T[], page: number) {
  const start = (page - 1) * ITEMS_PER_PAGE;
  return items.slice(start, start + ITEMS_PER_PAGE);
}

function Pagination({ page, totalPages, onPage, color = '#0F172A' }: { page: number; totalPages: number; onPage: (p: number) => void; color?: string }) {
  if (totalPages <= 1) return null;
  return (
    <div class="flex items-center gap-2">
      {Array.from({ length: totalPages }).map((_, i) => {
        const p = i + 1;
        const active = p === page;
        return (
          <button key={p} onClick={() => onPage(p)} class="w-8 h-8 rounded-lg text-xs font-bold transition-all" style={{ background: active ? color : '#F8FAFC', color: active ? '#fff' : '#64748B', border: active ? 'none' : '1px solid #E2E8F0' }}>{p}</button>
        );
      })}
    </div>
  );
}

export default defineComponent({
  name: 'Inventario',
  setup() {
    const pestana = ref<'productos' | 'servicios'>('productos');
    const busqueda = ref('');
    const tipo = ref('Todos los tipos');
    const categoriaServ = ref('Todas las categorías');
    const modal = ref(false);
    const modalServicio = ref(false);
    const form = ref<ProductoForm>(formVacio());
    const formServicio = ref<ServicioForm>({ ...formServicioVacio });
    const productoEditando = ref<string | null>(null);
    const servicioEditando = ref<string | null>(null);
    const paginaProductos = ref(1);
    const paginaServicios = ref(1);
    const cargando = ref(false);
    const guardando = ref(false);
    const error = ref('');

    const cargarBackend = async () => {
      cargando.value = true;
      error.value = '';
      try {
        const [sucursales, productos, servicios] = await Promise.all([
          getSucursales(),
          getProducts(),
          getServicios(),
        ]);
        store.sucursales.splice(0, store.sucursales.length, ...sucursales.map(mapSucursalApi));
        store.productos.splice(0, store.productos.length, ...productos.map(mapProductoApi));
        await Promise.all(store.productos.map(cargarStockProducto));
        store.servicios.splice(0, store.servicios.length, ...servicios.map(mapServicioApi));
        refreshSucursalSummaries();
      } catch (err) {
        error.value = errorMessage(err, 'No se pudo cargar inventario y servicios desde el backend.');
      } finally {
        cargando.value = false;
      }
    };

    onMounted(cargarBackend);

    const setBusqueda = (value: string) => { busqueda.value = value; paginaProductos.value = 1; paginaServicios.value = 1; };
    const setTipo = (value: string) => { tipo.value = value; paginaProductos.value = 1; };
    const setCategoriaServ = (value: string) => { categoriaServ.value = value; paginaServicios.value = 1; };

    const abrirModalProducto = (producto?: Producto) => {
      if (producto) {
        const stockStr: Record<string, string> = {};
        store.sucursales.forEach((s) => { stockStr[s.id] = String(producto.stockPorSucursal[s.id] ?? 0); });
        form.value = {
          nombre: producto.nombre,
          tipo: producto.tipo,
          stockPorSucursal: stockStr,
          precio: String(parseMoney(producto.precio)),
          proveedor: producto.proveedor,
          descripcion: producto.descripcion ?? '',
        };
        productoEditando.value = producto.id;
      } else {
        form.value = formVacio();
        productoEditando.value = null;
      }
      modal.value = true;
    };

    const guardarProducto = async () => {
      if (!form.value.nombre.trim()) return;
      const precio = parseMoney(form.value.precio);
      if (!Number.isFinite(precio) || precio <= 0) {
        error.value = 'El precio debe ser un número positivo.';
        return;
      }
      const stockPorSucursal: Record<string, number> = {};
      store.sucursales.forEach((s) => { stockPorSucursal[s.id] = Number(form.value.stockPorSucursal[s.id]) || 0; });
      const data = {
        nombre: form.value.nombre,
        tipo: form.value.tipo || 'Motor',
        stockPorSucursal,
        precio,
        proveedor: form.value.proveedor,
        descripcion: form.value.descripcion,
      };
      guardando.value = true;
      error.value = '';
      try {
        if (productoEditando.value) {
          await apiUpdateProduct(productoEditando.value, {
            nombre: data.nombre,
            tipo: data.tipo,
            precio: data.precio,
            proveedor: data.proveedor,
            isv: 'isv_15',
          });
        } else {
          const nuevoProducto = await apiCreateProduct({
            codigo: `PRD-${Date.now().toString().slice(-6)}`,
            nombre: data.nombre,
            tipo: data.tipo,
            precio: data.precio,
            proveedor: data.proveedor,
            isv: 'isv_15',
            activo: true,
          });
          productoEditando.value = nuevoProducto.id;
        }
        const productId = productoEditando.value;
        if (productId) {
          await Promise.all(
            store.sucursales.map((s) => setInventarioStock(s.id, productId, stockPorSucursal[s.id] ?? 0)),
          );
        }
        await cargarBackend();
        modal.value = false;
        form.value = formVacio();
        productoEditando.value = null;
      } catch (err) {
        error.value = errorMessage(err, 'No se pudo guardar el producto.');
      } finally {
        guardando.value = false;
      }
    };

    const abrirModalServicio = (servicio?: Servicio) => {
      if (servicio) {
        formServicio.value = { descripcion: servicio.descripcion, categoria: servicio.categoria, precio: String(servicio.precio), notas: servicio.notas ?? '' };
        servicioEditando.value = servicio.id;
      } else {
        formServicio.value = { ...formServicioVacio };
        servicioEditando.value = null;
      }
      modalServicio.value = true;
    };

    const guardarServicio = async () => {
      if (!formServicio.value.descripcion.trim()) return;
      const data = {
        descripcion: formServicio.value.descripcion,
        categoria: formServicio.value.categoria || 'General',
        precio: Number(formServicio.value.precio) || 0,
        notas: formServicio.value.notas,
      };
      guardando.value = true;
      error.value = '';
      try {
        if (servicioEditando.value) await apiUpdateServicio(servicioEditando.value, data);
        else await apiCreateServicio(data);
        await cargarBackend();
        modalServicio.value = false;
        formServicio.value = { ...formServicioVacio };
        servicioEditando.value = null;
      } catch (err) {
        error.value = errorMessage(err, 'No se pudo guardar el servicio.');
      } finally {
        guardando.value = false;
      }
    };

    const eliminarProducto = async (id: string) => {
      if (!confirm('¿Estás seguro de eliminar este producto?')) return;
      guardando.value = true;
      error.value = '';
      try {
        await apiDeleteProduct(id);
        await cargarBackend();
      } catch (err) {
        error.value = errorMessage(err, 'No se pudo eliminar el producto.');
      } finally {
        guardando.value = false;
      }
    };

    const eliminarServicio = async (id: string) => {
      if (!confirm('¿Estás seguro de eliminar este servicio?')) return;
      guardando.value = true;
      error.value = '';
      try {
        await apiDeleteServicio(id);
        await cargarBackend();
      } catch (err) {
        error.value = errorMessage(err, 'No se pudo eliminar el servicio.');
      } finally {
        guardando.value = false;
      }
    };

    return () => {
      const productosFiltrados = store.productos.filter((p) => {
        const matchBusq = p.nombre.toLowerCase().includes(busqueda.value.toLowerCase()) || p.id.toLowerCase().includes(busqueda.value.toLowerCase());
        const matchTipo = tipo.value === 'Todos los tipos' || p.tipo === tipo.value;
        return matchBusq && matchTipo;
      });
      const serviciosFiltrados = store.servicios.filter((s) => {
        const matchBusq = s.descripcion.toLowerCase().includes(busqueda.value.toLowerCase()) || s.id.toLowerCase().includes(busqueda.value.toLowerCase());
        const matchCat = categoriaServ.value === 'Todas las categorías' || s.categoria === categoriaServ.value;
        return matchBusq && matchCat;
      });
      const totalPagesProductos = Math.max(1, Math.ceil(productosFiltrados.length / ITEMS_PER_PAGE));
      const totalPagesServicios = Math.max(1, Math.ceil(serviciosFiltrados.length / ITEMS_PER_PAGE));
      if (paginaProductos.value > totalPagesProductos) paginaProductos.value = totalPagesProductos;
      if (paginaServicios.value > totalPagesServicios) paginaServicios.value = totalPagesServicios;
      const productosPagina = paginate(productosFiltrados, paginaProductos.value);
      const serviciosPagina = paginate(serviciosFiltrados, paginaServicios.value);
      const alertas = store.productos.filter((p) => ['critico', 'advertencia'].includes(getEstadoProducto(p))).length;
      const valorInventario = store.productos.reduce((acc, p) => acc + totalStock(p) * parseMoney(p.precio), 0);

      return (
        <div class="space-y-5">
          {error.value && <div class="rounded-xl px-4 py-3 text-sm font-semibold" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>{error.value}</div>}
          {cargando.value && <div class="rounded-xl px-4 py-3 text-sm font-semibold" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8' }}>Cargando datos desde el backend...</div>}
          <div class="flex gap-2">
            <button onClick={() => (pestana.value = 'productos')} class="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all" style={{ background: pestana.value === 'productos' ? '#0F172A' : '#F8FAFC', color: pestana.value === 'productos' ? '#fff' : '#64748B', border: pestana.value === 'productos' ? 'none' : '1px solid #E2E8F0' }}><Package size={16} /> Productos</button>
            <button onClick={() => (pestana.value = 'servicios')} class="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all" style={{ background: pestana.value === 'servicios' ? 'linear-gradient(135deg,#FB923C,#FDBA74)' : '#F8FAFC', color: pestana.value === 'servicios' ? '#fff' : '#64748B', border: pestana.value === 'servicios' ? 'none' : '1px solid #E2E8F0' }}><Wrench size={16} /> Servicios y Mano de Obra</button>
          </div>

          <div class="grid grid-cols-3 gap-4">
            {(pestana.value === 'productos'
              ? [
                  { label: 'Total productos', value: store.productos.length.toLocaleString('es-HN'), color: '#38BDF8' },
                  { label: 'Stock crítico', value: `${alertas} alertas`, color: '#F87171' },
                  { label: 'Valor inventario', value: formatMoney(valorInventario), color: '#86EFAC' },
                ]
              : [
                  { label: 'Total servicios', value: store.servicios.length.toString(), color: '#FB923C' },
                  { label: 'Precio promedio', value: formatMoney(store.servicios.reduce((a, s) => a + s.precio, 0) / Math.max(store.servicios.length, 1)), color: '#38BDF8' },
                  { label: 'Categorías', value: new Set(store.servicios.map((s) => s.categoria)).size.toString(), color: '#86EFAC' },
                ]).map((s) => <div key={s.label} class="rounded-2xl px-5 py-4 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.06)' }}><div class="text-xl font-bold" style={{ color: s.color }}>{s.value}</div><div class="text-xs" style={{ color: '#64748B' }}>{s.label}</div></div>)}
          </div>

          <div class="rounded-2xl p-5 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.06)' }}>
            <div class="flex flex-wrap gap-3 items-center justify-between">
              <div class="flex flex-wrap gap-3 flex-1">
                <div class="relative flex-1 min-w-48"><Search size={15} class="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} /><input value={busqueda.value} onChange={(e) => setBusqueda((e.target as HTMLInputElement).value)} placeholder={pestana.value === 'productos' ? 'Buscar por nombre o código...' : 'Buscar servicio...'} class="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#111827' }} /></div>
                {pestana.value === 'productos' ? <div class="relative"><select value={tipo.value} onChange={(e) => setTipo((e.target as HTMLSelectElement).value)} class="pl-3 pr-8 py-2.5 rounded-xl text-sm outline-none appearance-none" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#374151' }}>{categoriasProducto.map((t) => <option key={t}>{t}</option>)}</select><ChevronDown size={14} class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} /></div> : <div class="relative"><select value={categoriaServ.value} onChange={(e) => setCategoriaServ((e.target as HTMLSelectElement).value)} class="pl-3 pr-8 py-2.5 rounded-xl text-sm outline-none appearance-none" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#374151' }}>{categoriasServicio.map((c) => <option key={c}>{c}</option>)}</select><ChevronDown size={14} class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} /></div>}
              </div>
              {pestana.value === 'productos' ? <button onClick={() => abrirModalProducto()} class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all" style={{ background: '#0F172A', color: '#fff' }}><Plus size={15} /> Agregar producto</button> : <button onClick={() => abrirModalServicio()} class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all" style={{ background: 'linear-gradient(135deg,#FB923C,#FDBA74)', color: '#fff' }}><Plus size={15} /> Agregar servicio</button>}
            </div>
          </div>

          {pestana.value === 'productos' ? (
            <div class="rounded-2xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.06)' }}>
              <div class="overflow-x-auto"><table class="w-full"><thead><tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>{['Código', 'Producto', 'Tipo', ...store.sucursales.map((s) => sucursalLabel(s.nombre)), 'Precio', 'Proveedor', 'Estado', ''].map((h) => <th key={h} class="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#64748B' }}>{h}</th>)}</tr></thead><tbody>{productosPagina.map((p, i) => { const estado = getEstadoProducto(p); const est = estadoLabel[estado]; const EstIcon = est.icon; return <tr key={p.id} style={{ borderBottom: '1px solid #F8FAFC', background: i % 2 === 0 ? '#fff' : '#FAFBFC' }}><td class="px-4 py-3 text-xs font-mono font-semibold" style={{ color: '#64748B' }}>{p.id}</td><td class="px-4 py-3"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#F1F5F9' }}><Package size={13} style={{ color: '#64748B' }} /></div><span class="text-sm font-semibold" style={{ color: '#0F172A' }}>{p.nombre}</span></div></td><td class="px-4 py-3 text-xs" style={{ color: '#64748B' }}>{p.tipo}</td>{store.sucursales.map((s) => { const qty = p.stockPorSucursal[s.id] ?? 0; return <td key={s.id} class="px-4 py-3"><span class="text-sm font-semibold" style={{ color: qty <= store.umbrales.critico ? '#F87171' : '#0F172A' }}>{qty}</span></td>; })}<td class="px-4 py-3 text-sm font-semibold" style={{ color: '#374151' }}>{p.precio}</td><td class="px-4 py-3 text-xs" style={{ color: '#64748B' }}>{p.proveedor}</td><td class="px-4 py-3"><span class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold w-fit" style={{ background: est.bg, color: est.color }}><EstIcon size={11} /> {est.text}</span></td><td class="px-4 py-3"><div class="flex items-center gap-1"><button disabled={guardando.value} onClick={() => abrirModalProducto(p)} class="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-slate-100"><Edit2 size={13} style={{ color: '#64748B' }} /></button><button disabled={guardando.value} onClick={() => eliminarProducto(p.id)} class="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-50"><Trash2 size={13} style={{ color: '#F87171' }} /></button></div></td></tr>; })}</tbody></table></div>
              <div class="px-4 py-3 flex items-center justify-between" style={{ borderTop: '1px solid #F1F5F9' }}><span class="text-xs" style={{ color: '#94A3B8' }}>Mostrando {productosPagina.length} de {productosFiltrados.length} productos filtrados · {store.productos.length} registrados</span><Pagination page={paginaProductos.value} totalPages={totalPagesProductos} onPage={(p) => (paginaProductos.value = p)} /></div>
            </div>
          ) : (
            <div class="rounded-2xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.06)' }}>
              <div class="overflow-x-auto"><table class="w-full"><thead><tr style={{ background: '#FFF7ED', borderBottom: '1px solid #FDBA74' }}>{['Código', 'Descripción del servicio', 'Categoría', 'Precio', ''].map((h) => <th key={h} class="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#C2410C' }}>{h}</th>)}</tr></thead><tbody>{serviciosPagina.map((s, i) => <tr key={s.id} style={{ borderBottom: '1px solid #FFF7ED', background: i % 2 === 0 ? '#fff' : '#FFFBF5' }}><td class="px-4 py-3 text-xs font-mono font-semibold" style={{ color: '#FB923C' }}>{s.id}</td><td class="px-4 py-3"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#FFF7ED' }}><Wrench size={13} style={{ color: '#FB923C' }} /></div><span class="text-sm font-semibold" style={{ color: '#0F172A' }}>{s.descripcion}</span></div></td><td class="px-4 py-3"><span class="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: '#FFF7ED', color: '#C2410C' }}>{s.categoria}</span></td><td class="px-4 py-3 text-sm font-bold" style={{ color: '#FB923C' }}>{formatMoney(s.precio)}</td><td class="px-4 py-3"><div class="flex items-center gap-1"><button disabled={guardando.value} onClick={() => abrirModalServicio(s)} class="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-orange-50"><Edit2 size={13} style={{ color: '#FB923C' }} /></button><button disabled={guardando.value} onClick={() => eliminarServicio(s.id)} class="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-50"><Trash2 size={13} style={{ color: '#F87171' }} /></button></div></td></tr>)}</tbody></table></div>
              <div class="px-4 py-3 flex items-center justify-between" style={{ borderTop: '1px solid #FFF7ED' }}><span class="text-xs" style={{ color: '#94A3B8' }}>Mostrando {serviciosPagina.length} de {serviciosFiltrados.length} servicios filtrados · {store.servicios.length} registrados</span><Pagination page={paginaServicios.value} totalPages={totalPagesServicios} onPage={(p) => (paginaServicios.value = p)} color="#FB923C" /></div>
            </div>
          )}

          {modal.value && <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.5)' }}><div class="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden" style={{ background: '#fff' }}><div class="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #F1F5F9' }}><h2 class="font-bold text-lg" style={{ color: '#0F172A' }}>{productoEditando.value ? 'Editar producto' : 'Agregar producto'}</h2><button onClick={() => { modal.value = false; form.value = formVacio(); productoEditando.value = null; }} class="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#F8FAFC' }}><X size={16} style={{ color: '#64748B' }} /></button></div><div class="p-6 space-y-4 max-h-[70vh] overflow-y-auto"><div class="grid grid-cols-2 gap-4"><div class="col-span-2"><label class="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Nombre del producto</label><input value={form.value.nombre} onChange={(e) => (form.value = { ...form.value, nombre: (e.target as HTMLInputElement).value })} placeholder="Ej. Filtro de aceite 5W-30" class="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#111827' }} /></div><div><label class="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Tipo de pieza</label><select value={form.value.tipo} onChange={(e) => (form.value = { ...form.value, tipo: (e.target as HTMLSelectElement).value })} class="w-full px-3 py-2.5 rounded-xl text-sm outline-none appearance-none" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#374151' }}><option value="">Seleccionar tipo</option>{categoriasProducto.slice(1).map((t) => <option key={t}>{t}</option>)}</select></div><div><label class="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Proveedor</label><input value={form.value.proveedor} onChange={(e) => (form.value = { ...form.value, proveedor: (e.target as HTMLInputElement).value })} placeholder="Nombre del proveedor" class="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#111827' }} /></div><div class="col-span-2"><label class="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Precio unitario (L.)</label><input value={form.value.precio} onChange={(e) => (form.value = { ...form.value, precio: (e.target as HTMLInputElement).value })} placeholder="0.00" class="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#111827' }} /></div><div class="col-span-2"><label class="block text-xs font-semibold mb-2" style={{ color: '#374151' }}>Stock por sucursal</label><div class="space-y-2 rounded-xl overflow-hidden" style={{ border: '1px solid #E2E8F0' }}>{store.sucursales.map((s, idx) => <div key={s.id} class="flex items-center gap-3 px-4 py-3" style={{ background: idx % 2 === 0 ? '#F8FAFC' : '#fff', borderBottom: idx < store.sucursales.length - 1 ? '1px solid #F1F5F9' : 'none' }}><div class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ background: '#0F172A', color: '#fff' }}>{idx + 1}</div><span class="flex-1 text-sm font-semibold" style={{ color: '#374151' }}>{s.nombre}</span><div class="flex items-center gap-2"><span class="text-xs" style={{ color: '#94A3B8' }}>Cantidad:</span><input type="number" min="0" value={form.value.stockPorSucursal[s.id] ?? ''} onChange={(e) => (form.value = { ...form.value, stockPorSucursal: { ...form.value.stockPorSucursal, [s.id]: (e.target as HTMLInputElement).value } })} placeholder="0" class="w-20 px-2 py-1.5 rounded-lg text-sm outline-none text-center" style={{ background: '#fff', border: '1px solid #E2E8F0', color: '#111827' }} /></div></div>)}</div></div><div class="col-span-2"><label class="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Descripción</label><textarea value={form.value.descripcion} onChange={(e) => (form.value = { ...form.value, descripcion: (e.target as HTMLTextAreaElement).value })} placeholder="Descripción del producto..." rows={2} class="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#111827' }} /></div></div></div><div class="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid #F1F5F9' }}><button onClick={() => { modal.value = false; form.value = formVacio(); productoEditando.value = null; }} class="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0' }}>Cancelar</button><button onClick={guardarProducto} class="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: '#0F172A', color: '#fff' }}>{productoEditando.value ? 'Actualizar producto' : 'Guardar producto'}</button></div></div></div>}

          {modalServicio.value && <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.5)' }}><div class="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden" style={{ background: '#fff' }}><div class="flex items-center justify-between px-6 py-5" style={{ background: 'linear-gradient(135deg,#FB923C,#FDBA74)', borderBottom: '1px solid #FB923C' }}><div class="flex items-center gap-2"><Wrench size={18} style={{ color: '#fff' }} /><h2 class="font-bold text-lg" style={{ color: '#fff' }}>{servicioEditando.value ? 'Editar servicio' : 'Agregar servicio'}</h2></div><button onClick={() => { modalServicio.value = false; formServicio.value = { ...formServicioVacio }; servicioEditando.value = null; }} class="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}><X size={16} style={{ color: '#fff' }} /></button></div><div class="p-6 space-y-4 max-h-[70vh] overflow-y-auto"><div class="grid grid-cols-2 gap-4"><div class="col-span-2"><label class="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Descripción del servicio</label><input value={formServicio.value.descripcion} onChange={(e) => (formServicio.value = { ...formServicio.value, descripcion: (e.target as HTMLInputElement).value })} placeholder="Ej. Instalación de frenos completo" class="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: '#FFF7ED', border: '1px solid #FDBA74', color: '#111827' }} /></div><div><label class="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Categoría</label><select value={formServicio.value.categoria} onChange={(e) => (formServicio.value = { ...formServicio.value, categoria: (e.target as HTMLSelectElement).value })} class="w-full px-3 py-2.5 rounded-xl text-sm outline-none appearance-none" style={{ background: '#FFF7ED', border: '1px solid #FDBA74', color: '#374151' }}><option value="">Seleccionar categoría</option>{categoriasServicio.slice(1).map((c) => <option key={c}>{c}</option>)}</select></div><div><label class="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Precio (L.)</label><input value={formServicio.value.precio} onChange={(e) => (formServicio.value = { ...formServicio.value, precio: (e.target as HTMLInputElement).value })} placeholder="0.00" type="number" step="0.01" min="0" class="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: '#FFF7ED', border: '1px solid #FDBA74', color: '#111827' }} /></div><div class="col-span-2"><label class="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Notas adicionales</label><textarea value={formServicio.value.notas} onChange={(e) => (formServicio.value = { ...formServicio.value, notas: (e.target as HTMLTextAreaElement).value })} placeholder="Detalles adicionales del servicio..." rows={3} class="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none" style={{ background: '#FFF7ED', border: '1px solid #FDBA74', color: '#111827' }} /></div></div></div><div class="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid #FFF7ED' }}><button onClick={() => { modalServicio.value = false; formServicio.value = { ...formServicioVacio }; servicioEditando.value = null; }} class="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0' }}>Cancelar</button><button onClick={guardarServicio} class="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: 'linear-gradient(135deg,#FB923C,#FDBA74)', color: '#fff' }}>{servicioEditando.value ? 'Actualizar servicio' : 'Guardar servicio'}</button></div></div></div>}
        </div>
      );
    };
  },
});
</script>
