<script lang="tsx">
import { defineComponent, onBeforeUnmount, onMounted, ref } from 'vue';
import { Search, Plus, Edit2, Trash2, X, Package, AlertTriangle, CheckCircle, ChevronDown, RefreshCw } from 'lucide-vue-next';
import { store, categoriasProducto, getEstadoProducto, totalStock, parseMoney, formatMoney, type Producto } from '../store';
import { createProduct, deleteProduct, getProducts, updateProduct } from '../api/products';
import { getSucursales } from '../api/sucursales';
import { getInventario, setInventario } from '../api/inventario';
import type { Product as ApiProduct, Sucursal } from '../api/schemas';

const ITEMS_PER_PAGE = 8;

const estadoLabel = {
  critico: { text: 'Stock crítico', color: '#F87171', bg: '#FEF2F2', icon: AlertTriangle },
  advertencia: { text: 'Advertencia', color: '#FDBA74', bg: '#FFF7ED', icon: AlertTriangle },
  disponible: { text: 'Disponible', color: '#4ADE80', bg: '#F0FDF4', icon: CheckCircle },
  sobrestock: { text: 'Sobrestock', color: '#38BDF8', bg: '#F0F9FF', icon: CheckCircle },
};

interface ProductoForm {
  codigo: string;
  nombre: string;
  tipo: string;
  stockPorSucursal: Record<string, string>;
  precio: string;
  proveedor: string;
  descripcion: string;
}

interface ProductoInventario extends Producto {
  apiId: string;
  codigo: string;
  isv?: string | null;
}

function formVacio(): ProductoForm {
  const stockPorSucursal: Record<string, string> = {};
  store.sucursales.forEach((s) => { stockPorSucursal[s.id] = ''; });
  return { codigo: '', nombre: '', tipo: '', stockPorSucursal, precio: '', proveedor: '', descripcion: '' };
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

function formatPrecioInventario(precio: string | number) {
  const value = Number(precio ?? 0);
  if (!Number.isFinite(value)) return String(precio ?? 'L. 0.00');
  return formatMoney(value);
}

function productoDesdeApi(producto: ApiProduct, sucursales: Sucursal[], stockPorSucursal: Record<string, number>): ProductoInventario {
  return {
    id: producto.codigo,
    apiId: producto.id,
    codigo: producto.codigo,
    nombre: producto.nombre,
    tipo: producto.tipo_producto?.tipo ?? 'Sin tipo',
    stockPorSucursal,
    precio: formatPrecioInventario(producto.precio),
    proveedor: producto.proveedor?.nombre ?? 'Sin proveedor',
    isv: producto.isv,
  };
}

export default defineComponent({
  name: 'Inventario',
  setup() {
    const busqueda = ref('');
    const tipo = ref('Todos los tipos');
    const modal = ref(false);
    const form = ref<ProductoForm>(formVacio());
    const productoEditando = ref<string | null>(null);
    const paginaProductos = ref(1);
    const productosInventario = ref<ProductoInventario[]>([]);
    const sucursalesInventario = ref<Sucursal[]>([]);
    const cargandoInventario = ref(false);
    const errorInventario = ref('');

    const setBusqueda = (value: string) => { busqueda.value = value; paginaProductos.value = 1; };
    const setTipo = (value: string) => { tipo.value = value; paginaProductos.value = 1; };

    const cargarInventario = async () => {
      cargandoInventario.value = true;
      errorInventario.value = '';
      try {
        const [productosApi, sucursalesApi] = await Promise.all([getProducts(), getSucursales()]);
        sucursalesInventario.value = sucursalesApi;
        productosInventario.value = await Promise.all(
          productosApi.map(async (producto) => {
            const stockEntries = await Promise.all(
              sucursalesApi.map(async (sucursal) => {
                try {
                  const inventario = await getInventario(String(sucursal.id), producto.id);
                  return [String(sucursal.id), inventario.cantidad] as const;
                } catch {
                  return [String(sucursal.id), 0] as const;
                }
              }),
            );
            return productoDesdeApi(producto, sucursalesApi, Object.fromEntries(stockEntries));
          }),
        );
      } catch (err) {
        console.error('Error al cargar inventario:', err);
        errorInventario.value = err instanceof Error ? err.message : 'No se pudo cargar el inventario.';
      } finally {
        cargandoInventario.value = false;
      }
    };

    onMounted(() => {
      cargarInventario();
      window.addEventListener('turbo:factura-creada', cargarInventario);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('turbo:factura-creada', cargarInventario);
    });

    const abrirModalProducto = (producto?: ProductoInventario) => {
      if (producto) {
        const stockStr: Record<string, string> = {};
        sucursalesInventario.value.forEach((s) => { stockStr[String(s.id)] = String(producto.stockPorSucursal[String(s.id)] ?? 0); });
        form.value = {
          codigo: producto.codigo,
          nombre: producto.nombre,
          tipo: producto.tipo,
          stockPorSucursal: stockStr,
          precio: String(parseMoney(producto.precio)),
          proveedor: producto.proveedor,
          descripcion: producto.descripcion ?? '',
        };
        productoEditando.value = producto.apiId;
      } else {
        form.value = formVacio();
        productoEditando.value = null;
      }
      modal.value = true;
    };

    const guardarProducto = async () => {
      if (!form.value.nombre.trim()) return;
      const stockNum: Record<string, number> = {};
      sucursalesInventario.value.forEach((s) => { stockNum[String(s.id)] = Number(form.value.stockPorSucursal[String(s.id)]) || 0; });
      const data = {
        ...(productoEditando.value && form.value.codigo.trim() ? { codigo: form.value.codigo.trim() } : {}),
        nombre: form.value.nombre,
        tipo: form.value.tipo || 'Motor',
        precio: String(Number(form.value.precio) || 0),
        proveedor: form.value.proveedor,
        isv: 'isv_15',
      };
      cargandoInventario.value = true;
      errorInventario.value = '';
      try {
        const producto = productoEditando.value
          ? await updateProduct(productoEditando.value, data)
          : await createProduct(data);

        await Promise.all(
          Object.entries(stockNum).map(([sucursal, cantidad]) =>
            setInventario(sucursal, producto.id, cantidad),
          ),
        );

        modal.value = false;
        form.value = formVacio();
        productoEditando.value = null;
        await cargarInventario();
      } catch (err) {
        console.error('Error al guardar producto:', err);
        errorInventario.value = err instanceof Error ? err.message : 'No se pudo guardar el producto.';
      } finally {
        cargandoInventario.value = false;
      }
    };

    const eliminarProducto = async (producto: ProductoInventario) => {
      if (!confirm('¿Estás seguro de eliminar este producto?')) return;
      cargandoInventario.value = true;
      errorInventario.value = '';
      try {
        await deleteProduct(producto.apiId);
        await cargarInventario();
      } catch (err) {
        console.error('Error al eliminar producto:', err);
        errorInventario.value = err instanceof Error ? err.message : 'No se pudo eliminar el producto.';
      } finally {
        cargandoInventario.value = false;
      }
    };

    return () => {
      const productosFiltrados = productosInventario.value.filter((p) => {
        const matchBusq = p.nombre.toLowerCase().includes(busqueda.value.toLowerCase()) || p.id.toLowerCase().includes(busqueda.value.toLowerCase());
        const matchTipo = tipo.value === 'Todos los tipos' || p.tipo === tipo.value;
        return matchBusq && matchTipo;
      });
      const totalPagesProductos = Math.max(1, Math.ceil(productosFiltrados.length / ITEMS_PER_PAGE));
      if (paginaProductos.value > totalPagesProductos) paginaProductos.value = totalPagesProductos;
      const productosPagina = paginate(productosFiltrados, paginaProductos.value);
      const alertas = productosInventario.value.filter((p) => ['critico', 'advertencia'].includes(getEstadoProducto(p))).length;
      const valorInventario = productosInventario.value.reduce((acc, p) => acc + totalStock(p) * parseMoney(p.precio), 0);

      return (
        <div class="space-y-5">
          <div class="grid grid-cols-3 gap-4">
            {[
              { label: 'Total productos', value: productosInventario.value.length.toLocaleString('es-HN'), color: '#38BDF8' },
              { label: 'Stock crítico', value: `${alertas} alertas`, color: '#F87171' },
              { label: 'Valor inventario', value: formatMoney(valorInventario), color: '#86EFAC' },
            ].map((s) => <div key={s.label} class="rounded-2xl px-5 py-4 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.06)' }}><div class="text-xl font-bold" style={{ color: s.color }}>{s.value}</div><div class="text-xs" style={{ color: '#64748B' }}>{s.label}</div></div>)}
          </div>

          <div class="rounded-2xl p-5 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.06)' }}>
            <div class="flex flex-wrap gap-3 items-center justify-between">
              <div class="flex flex-wrap gap-3 flex-1">
                <div class="relative flex-1 min-w-48"><Search size={15} class="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} /><input value={busqueda.value} onChange={(e) => setBusqueda((e.target as HTMLInputElement).value)} placeholder="Buscar por nombre o código..." class="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#111827' }} /></div>
                <div class="relative"><select value={tipo.value} onChange={(e) => setTipo((e.target as HTMLSelectElement).value)} class="pl-3 pr-8 py-2.5 rounded-xl text-sm outline-none appearance-none" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#374151' }}>{categoriasProducto.map((t) => <option key={t}>{t}</option>)}</select><ChevronDown size={14} class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} /></div>
              </div>
              <div class="flex items-center gap-2"><button onClick={cargarInventario} disabled={cargandoInventario.value} class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all" style={{ background: '#F8FAFC', color: '#334155', border: '1px solid #E2E8F0' }}><RefreshCw size={15} class={cargandoInventario.value ? 'animate-spin' : ''} /> Actualizar</button><button onClick={() => abrirModalProducto()} class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all" style={{ background: '#0F172A', color: '#fff' }}><Plus size={15} /> Agregar producto</button></div>
            </div>
          </div>

          {errorInventario.value && <div class="rounded-xl px-4 py-3 text-sm font-semibold" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>{errorInventario.value}</div>}
          {cargandoInventario.value && <div class="rounded-xl px-4 py-3 text-sm font-semibold" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8' }}>Actualizando inventario desde el backend...</div>}

          <div class="rounded-2xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.06)' }}>
            <div class="overflow-x-auto"><table class="w-full"><thead><tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>{['Código', 'Producto', 'Tipo', ...sucursalesInventario.value.map((s) => sucursalLabel(s.nombre)), 'Precio', 'Proveedor', 'Estado', ''].map((h) => <th key={h} class="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#64748B' }}>{h}</th>)}</tr></thead><tbody>{productosPagina.map((p, i) => { const estado = getEstadoProducto(p); const est = estadoLabel[estado]; const EstIcon = est.icon; return <tr key={p.apiId} style={{ borderBottom: '1px solid #F8FAFC', background: i % 2 === 0 ? '#fff' : '#FAFBFC' }}><td class="px-4 py-3 text-xs font-mono font-semibold" style={{ color: '#64748B' }}>{p.codigo}</td><td class="px-4 py-3"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#F1F5F9' }}><Package size={13} style={{ color: '#64748B' }} /></div><span class="text-sm font-semibold" style={{ color: '#0F172A' }}>{p.nombre}</span></div></td><td class="px-4 py-3 text-xs" style={{ color: '#64748B' }}>{p.tipo}</td>{sucursalesInventario.value.map((s) => { const id = String(s.id); const qty = p.stockPorSucursal[id] ?? 0; return <td key={id} class="px-4 py-3"><span class="text-sm font-semibold" style={{ color: qty <= store.umbrales.critico ? '#F87171' : '#0F172A' }}>{qty}</span></td>; })}<td class="px-4 py-3 text-sm font-semibold" style={{ color: '#374151' }}>{p.precio}</td><td class="px-4 py-3 text-xs" style={{ color: '#64748B' }}>{p.proveedor}</td><td class="px-4 py-3"><span class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold w-fit" style={{ background: est.bg, color: est.color }}><EstIcon size={11} /> {est.text}</span></td><td class="px-4 py-3"><div class="flex items-center gap-1"><button onClick={() => abrirModalProducto(p)} class="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-slate-100"><Edit2 size={13} style={{ color: '#64748B' }} /></button><button onClick={() => eliminarProducto(p)} class="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-50"><Trash2 size={13} style={{ color: '#F87171' }} /></button></div></td></tr>; })}</tbody></table></div>
            <div class="px-4 py-3 flex items-center justify-between" style={{ borderTop: '1px solid #F1F5F9' }}><span class="text-xs" style={{ color: '#94A3B8' }}>Mostrando {productosPagina.length} de {productosFiltrados.length} productos filtrados · {productosInventario.value.length} registrados</span><Pagination page={paginaProductos.value} totalPages={totalPagesProductos} onPage={(p) => (paginaProductos.value = p)} /></div>
          </div>

          {modal.value && <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.5)' }}><div class="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden" style={{ background: '#fff' }}><div class="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #F1F5F9' }}><h2 class="font-bold text-lg" style={{ color: '#0F172A' }}>{productoEditando.value ? 'Editar producto' : 'Agregar producto'}</h2><button onClick={() => { modal.value = false; form.value = formVacio(); productoEditando.value = null; }} class="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#F8FAFC' }}><X size={16} style={{ color: '#64748B' }} /></button></div><div class="p-6 space-y-4 max-h-[70vh] overflow-y-auto"><div class="grid grid-cols-2 gap-4"><div class="col-span-2"><label class="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Nombre del producto</label><input value={form.value.nombre} onChange={(e) => (form.value = { ...form.value, nombre: (e.target as HTMLInputElement).value })} placeholder="Ej. Filtro de aceite 5W-30" class="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#111827' }} /></div><div><label class="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Tipo de pieza</label><select value={form.value.tipo} onChange={(e) => (form.value = { ...form.value, tipo: (e.target as HTMLSelectElement).value })} class="w-full px-3 py-2.5 rounded-xl text-sm outline-none appearance-none" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#374151' }}><option value="">Seleccionar tipo</option>{categoriasProducto.slice(1).map((t) => <option key={t}>{t}</option>)}</select></div><div><label class="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Proveedor</label><input value={form.value.proveedor} onChange={(e) => (form.value = { ...form.value, proveedor: (e.target as HTMLInputElement).value })} placeholder="Nombre del proveedor" class="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#111827' }} /></div><div class="col-span-2"><label class="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Precio unitario (L.)</label><input type="number" step="0.01" min="0" value={form.value.precio} onChange={(e) => (form.value = { ...form.value, precio: (e.target as HTMLInputElement).value })} placeholder="0.00" class="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#111827' }} /></div><div class="col-span-2"><label class="block text-xs font-semibold mb-2" style={{ color: '#374151' }}>Stock por sucursal</label><div class="space-y-2 rounded-xl overflow-hidden" style={{ border: '1px solid #E2E8F0' }}>{sucursalesInventario.value.map((s, idx) => { const id = String(s.id); return <div key={id} class="flex items-center gap-3 px-4 py-3" style={{ background: idx % 2 === 0 ? '#F8FAFC' : '#fff', borderBottom: idx < sucursalesInventario.value.length - 1 ? '1px solid #F1F5F9' : 'none' }}><div class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ background: '#0F172A', color: '#fff' }}>{idx + 1}</div><span class="flex-1 text-sm font-semibold" style={{ color: '#374151' }}>{s.nombre}</span><div class="flex items-center gap-2"><span class="text-xs" style={{ color: '#94A3B8' }}>Cantidad:</span><input type="number" min="0" value={form.value.stockPorSucursal[id] ?? ''} onChange={(e) => (form.value = { ...form.value, stockPorSucursal: { ...form.value.stockPorSucursal, [id]: (e.target as HTMLInputElement).value } })} placeholder="0" class="w-20 px-2 py-1.5 rounded-lg text-sm outline-none text-center" style={{ background: '#fff', border: '1px solid #E2E8F0', color: '#111827' }} /></div></div>; })}</div></div></div></div><div class="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid #F1F5F9' }}><button onClick={() => { modal.value = false; form.value = formVacio(); productoEditando.value = null; }} class="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0' }}>Cancelar</button><button onClick={guardarProducto} disabled={cargandoInventario.value} class="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: '#0F172A', color: '#fff' }}>{productoEditando.value ? 'Actualizar producto' : 'Guardar producto'}</button></div></div></div>}
        </div>
      );
    };
  },
});
</script>
