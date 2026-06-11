<script lang="tsx">
import { defineComponent, ref } from 'vue';
import { Building2, MapPin, Package, Plus, Edit2, Trash2, X } from 'lucide-vue-next';
import { store, addSucursal, updateSucursal, deleteSucursal, getSucursalCategoriaStock, getSucursalValorStock, formatMoney } from '../store';

interface SucursalForm { nombre: string; direccion: string; telefono: string; encargado: string; }
const formVacio: SucursalForm = { nombre: '', direccion: '', telefono: '', encargado: '' };

export default defineComponent({
  name: 'Sucursales',
  emits: ['setSucursales'],
  setup() {
    const modal = ref(false);
    const sucursalEditando = ref<string | null>(null);
    const form = ref<SucursalForm>({ ...formVacio });

    const abrirModalEditar = (s: typeof store.sucursales[number]) => {
      form.value = { nombre: s.nombre, direccion: s.direccion, telefono: s.telefono, encargado: s.encargado };
      sucursalEditando.value = s.id;
      modal.value = true;
    };

    const guardarSucursal = () => {
      if (!form.value.nombre.trim()) return;
      if (sucursalEditando.value) updateSucursal(sucursalEditando.value, form.value);
      else addSucursal(form.value);
      modal.value = false;
      form.value = { ...formVacio };
      sucursalEditando.value = null;
    };

    return () => {
      const totalProductos = store.sucursales.reduce((acc, s) => acc + s.productos, 0);
      const valorTotal = store.sucursales.reduce((acc, s) => acc + getSucursalValorStock(s.id), 0);
      const todasCategorias = Array.from(new Set(store.productos.map((p) => p.tipo)));
      const maxStock = Math.max(...store.sucursales.flatMap((s) => getSucursalCategoriaStock(s.id).map((c) => c.cantidad)), 1);

      return (
        <div class="space-y-5">
          <div class="flex items-center justify-between">
            <div class="grid grid-cols-3 gap-4 flex-1 mr-4">
              {[
                { label: 'Sucursales activas', value: store.sucursales.filter((s) => s.estado === 'Activa').length.toString() },
                { label: 'Productos en total', value: totalProductos.toLocaleString('es-HN') },
                { label: 'Valor total stock', value: formatMoney(valorTotal) },
              ].map((s) => <div key={s.label} class="rounded-2xl px-5 py-4 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.06)' }}><div class="text-xl font-bold" style={{ color: '#0F172A' }}>{s.value}</div><div class="text-xs" style={{ color: '#64748B' }}>{s.label}</div></div>)}
            </div>
            <button onClick={() => { form.value = { ...formVacio }; sucursalEditando.value = null; modal.value = true; }} class="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold flex-shrink-0" style={{ background: '#0F172A', color: '#fff' }}><Plus size={15} /> Agregar sucursal</button>
          </div>

          <div class="grid lg:grid-cols-3 gap-5">
            {store.sucursales.map((s) => {
              const stock = getSucursalCategoriaStock(s.id);
              const valorStock = formatMoney(getSucursalValorStock(s.id));
              return (
                <div key={s.id} class="rounded-2xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.06)' }}>
                  <div class="p-5" style={{ background: 'linear-gradient(135deg, #0F172A, #1E293B)' }}>
                    <div class="flex items-start justify-between mb-3"><div class="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(56,189,248,0.2)' }}><Building2 size={18} style={{ color: '#38BDF8' }} /></div><span class="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: 'rgba(134,239,172,0.15)', color: '#86EFAC' }}>{s.estado}</span></div>
                    <h3 class="font-bold text-white mb-0.5">{s.nombre}</h3>
                    <div class="flex items-start gap-1.5"><MapPin size={11} class="mt-0.5 flex-shrink-0" style={{ color: '#64748B' }} /><span class="text-xs leading-relaxed" style={{ color: '#94A3B8' }}>{s.direccion}</span></div>
                  </div>
                  <div class="p-5">
                    <div class="grid grid-cols-2 gap-3 mb-4"><div class="rounded-xl p-3" style={{ background: '#F8FAFC' }}><div class="flex items-center gap-1.5 mb-1"><Package size={12} style={{ color: '#94A3B8' }} /><span class="text-xs" style={{ color: '#64748B' }}>Unidades</span></div><div class="font-bold" style={{ color: '#0F172A' }}>{s.productos.toLocaleString('es-HN')}</div></div><div class="rounded-xl p-3" style={{ background: '#F8FAFC' }}><div class="text-xs mb-1" style={{ color: '#64748B' }}>Valor stock</div><div class="font-bold text-sm" style={{ color: '#38BDF8' }}>{valorStock}</div></div></div>
                    {stock.length > 0 && <div class="mb-4"><p class="text-xs font-semibold mb-2" style={{ color: '#374151' }}>Distribución por categoría</p><div class="space-y-2">{stock.map((cat) => <div key={cat.categoria}><div class="flex justify-between text-xs mb-1"><span style={{ color: '#64748B' }}>{cat.categoria}</span><span class="font-semibold" style={{ color: '#374151' }}>{cat.cantidad}</span></div><div class="h-1.5 rounded-full" style={{ background: '#F1F5F9' }}><div class="h-full rounded-full" style={{ width: `${Math.min((cat.cantidad / maxStock) * 100, 100)}%`, background: '#38BDF8' }} /></div></div>)}</div></div>}
                    <div class="flex gap-2"><button onClick={() => abrirModalEditar(s)} class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold" style={{ background: '#F8FAFC', color: '#374151', border: '1px solid #E2E8F0' }}><Edit2 size={12} /> Editar</button><button onClick={() => confirm('¿Estás seguro de eliminar esta sucursal?') && deleteSucursal(s.id)} class="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#FEF2F2' }}><Trash2 size={13} style={{ color: '#F87171' }} /></button></div>
                  </div>
                </div>
              );
            })}
          </div>

          {store.sucursales.length > 0 && (
            <div class="rounded-2xl p-6 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.06)' }}>
              <h3 class="font-bold mb-5" style={{ color: '#0F172A' }}>Comparativa de stock por sucursal</h3>
              <div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr style={{ borderBottom: '1px solid #F1F5F9' }}><th class="text-left pb-3 pr-6 text-xs font-semibold" style={{ color: '#64748B' }}>Categoría</th>{store.sucursales.map((s) => <th key={s.id} class="text-left pb-3 pr-6 text-xs font-semibold" style={{ color: '#64748B' }}>{s.nombre}</th>)}<th class="text-left pb-3 text-xs font-semibold" style={{ color: '#64748B' }}>Total</th></tr></thead><tbody>{todasCategorias.map((categoria) => { const totales = store.sucursales.map((s) => store.productos.filter((p) => p.tipo === categoria).reduce((acc, p) => acc + Number(p.stockPorSucursal[s.id] || 0), 0)); const total = totales.reduce((a, b) => a + b, 0); return <tr key={categoria} style={{ borderBottom: '1px solid #F8FAFC' }}><td class="py-3 pr-6 text-xs font-semibold" style={{ color: '#374151' }}>{categoria}</td>{totales.map((qty, i) => <td key={i} class="py-3 pr-6"><span class="text-sm font-bold" style={{ color: qty < 10 ? '#F87171' : qty < 40 ? '#FDBA74' : '#374151' }}>{qty}</span></td>)}<td class="py-3 text-sm font-bold" style={{ color: '#38BDF8' }}>{total}</td></tr>; })}</tbody></table></div>
            </div>
          )}

          {modal.value && <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.5)' }}><div class="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" style={{ background: '#fff' }}><div class="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #F1F5F9' }}><h2 class="font-bold" style={{ color: '#0F172A' }}>{sucursalEditando.value ? 'Editar sucursal' : 'Agregar sucursal'}</h2><button onClick={() => { modal.value = false; form.value = { ...formVacio }; sucursalEditando.value = null; }} class="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#F8FAFC' }}><X size={15} style={{ color: '#64748B' }} /></button></div><div class="p-6 space-y-4">{[
            { label: 'Nombre de la sucursal', field: 'nombre' as const, placeholder: 'Ej. Sucursal Occidente' },
            { label: 'Dirección completa', field: 'direccion' as const, placeholder: 'Calle, colonia, ciudad' },
            { label: 'Teléfono', field: 'telefono' as const, placeholder: '+504 2000-0000' },
            { label: 'Encargado / Gerente', field: 'encargado' as const, placeholder: 'Nombre del responsable' },
          ].map((f) => <div key={f.field}><label class="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>{f.label}</label><input value={form.value[f.field]} onChange={(e) => (form.value = { ...form.value, [f.field]: (e.target as HTMLInputElement).value })} placeholder={f.placeholder} class="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#111827' }} /></div>)}</div><div class="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid #F1F5F9' }}><button onClick={() => { modal.value = false; form.value = { ...formVacio }; sucursalEditando.value = null; }} class="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0' }}>Cancelar</button><button onClick={guardarSucursal} class="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: '#0F172A', color: '#fff' }}>{sucursalEditando.value ? 'Actualizar sucursal' : 'Guardar sucursal'}</button></div></div></div>}
        </div>
      );
    };
  },
});
</script>
