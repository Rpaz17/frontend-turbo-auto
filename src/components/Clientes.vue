<script lang="tsx">
import { defineComponent, ref } from 'vue';
import { Search, Plus, Phone, Mail, MapPin, Clock, ShoppingBag, X, Edit2, ChevronRight, Trash2 } from 'lucide-vue-next';
import { store, addCliente, updateCliente, deleteCliente, type Cliente } from '../store';

interface ClienteForm { nombre: string; telefono: string; email: string; ciudad: string; rtn: string; }
const formVacio: ClienteForm = { nombre: '', telefono: '', email: '', ciudad: '', rtn: '' };

export default defineComponent({
  name: 'Clientes',
  setup() {
    const busqueda = ref('');
    const seleccionadoId = ref<string | null>(store.clientes[0]?.id ?? null);
    const modal = ref(false);
    const clienteEditando = ref<string | null>(null);
    const form = ref<ClienteForm>({ ...formVacio });

    const abrirModalEditar = (cliente: Cliente) => {
      form.value = { nombre: cliente.nombre, telefono: cliente.telefono, email: cliente.email, ciudad: cliente.ciudad, rtn: cliente.rtn };
      clienteEditando.value = cliente.id;
      modal.value = true;
    };

    const guardarCliente = () => {
      if (!form.value.nombre.trim()) return;
      if (clienteEditando.value) updateCliente(clienteEditando.value, form.value);
      else {
        addCliente(form.value);
        seleccionadoId.value = store.clientes[store.clientes.length - 1]?.id ?? seleccionadoId.value;
      }
      modal.value = false;
      form.value = { ...formVacio };
      clienteEditando.value = null;
    };

    return () => {
      const filtrados = store.clientes.filter((c) => c.nombre.toLowerCase().includes(busqueda.value.toLowerCase()) || c.telefono.includes(busqueda.value) || c.id.toLowerCase().includes(busqueda.value.toLowerCase()));
      const seleccionado = store.clientes.find((c) => c.id === seleccionadoId.value) ?? filtrados[0] ?? null;
      const totalActivos = store.clientes.filter((c) => c.estado === 'Activo').length;
      return (
        <div class="space-y-5">
          <div class="grid grid-cols-3 gap-4">{[
            { label: 'Total clientes', value: store.clientes.length.toLocaleString('es-HN'), color: '#38BDF8' },
            { label: 'Clientes activos', value: totalActivos.toLocaleString('es-HN'), color: '#86EFAC' },
            { label: 'Nuevos este mes', value: `+${Math.max(1, store.clientes.length - 4)}`, color: '#C4B5FD' },
          ].map((k) => <div key={k.label} class="rounded-2xl px-5 py-4 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.06)' }}><div class="text-2xl font-bold" style={{ color: k.color }}>{k.value}</div><div class="text-xs" style={{ color: '#64748B' }}>{k.label}</div></div>)}</div>
          <div class="grid lg:grid-cols-5 gap-5">
            <div class="lg:col-span-2 rounded-2xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.06)' }}>
              <div class="p-5" style={{ borderBottom: '1px solid #F1F5F9' }}><div class="flex gap-3 mb-4"><div class="relative flex-1"><Search size={14} class="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} /><input value={busqueda.value} onChange={(e) => (busqueda.value = (e.target as HTMLInputElement).value)} placeholder="Buscar por nombre o teléfono..." class="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs outline-none" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#111827' }} /></div><button onClick={() => { form.value = { ...formVacio }; clienteEditando.value = null; modal.value = true; }} class="flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-semibold" style={{ background: '#0F172A', color: '#fff' }}><Plus size={13} /> Agregar</button></div></div>
              <div class="overflow-y-auto" style={{ maxHeight: '500px' }}>{filtrados.map((c) => <button key={c.id} onClick={() => (seleccionadoId.value = c.id)} class="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50" style={{ borderBottom: '1px solid #F8FAFC', background: seleccionado?.id === c.id ? '#F0F9FF' : 'transparent' }}><div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold" style={{ background: '#E0F2FE', color: '#0369A1' }}>{c.nombre.charAt(0)}</div><div class="flex-1 min-w-0"><div class="font-semibold text-sm truncate" style={{ color: '#0F172A' }}>{c.nombre}</div><div class="text-xs truncate" style={{ color: '#94A3B8' }}>{c.telefono}</div></div><div class="flex flex-col items-end gap-1"><span class="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: c.estado === 'Activo' ? '#F0FDF4' : '#F8FAFC', color: c.estado === 'Activo' ? '#16A34A' : '#94A3B8' }}>{c.estado}</span><ChevronRight size={12} style={{ color: '#CBD5E1' }} /></div></button>)}</div>
            </div>
            <div class="lg:col-span-3 rounded-2xl shadow-sm" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.06)' }}>
              {seleccionado ? <div class="h-full flex flex-col"><div class="p-6" style={{ borderBottom: '1px solid #F1F5F9' }}><div class="flex items-start justify-between mb-4"><div class="flex items-center gap-4"><div class="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold" style={{ background: '#E0F2FE', color: '#0369A1' }}>{seleccionado.nombre.charAt(0)}</div><div><h3 class="font-bold text-lg" style={{ color: '#0F172A' }}>{seleccionado.nombre}</h3><div class="text-xs font-mono" style={{ color: '#94A3B8' }}>RTN: {seleccionado.rtn}</div></div></div><div class="flex gap-2"><button onClick={() => abrirModalEditar(seleccionado)} class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: '#F8FAFC', color: '#374151', border: '1px solid #E2E8F0' }}><Edit2 size={11} /> Editar</button><button onClick={() => { if (confirm('¿Eliminar cliente?')) { deleteCliente(seleccionado.id); seleccionadoId.value = store.clientes[0]?.id ?? null; } }} class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: '#FEF2F2', color: '#F87171', border: '1px solid #FECACA' }}><Trash2 size={11} /> Eliminar</button></div></div><div class="grid grid-cols-2 gap-3">{[{ icon: Phone, text: seleccionado.telefono }, { icon: Mail, text: seleccionado.email }, { icon: MapPin, text: seleccionado.ciudad }, { icon: Clock, text: `Última compra: ${seleccionado.ultimaCompra}` }].map((item) => { const Icon = item.icon; return <div key={item.text} class="flex items-center gap-2 rounded-xl p-3" style={{ background: '#F8FAFC' }}><Icon size={14} style={{ color: '#38BDF8' }} /><span class="text-xs" style={{ color: '#64748B' }}>{item.text}</span></div>; })}</div></div><div class="p-6 grid grid-cols-3 gap-3" style={{ borderBottom: '1px solid #F1F5F9' }}>{[{ label: 'Compras', value: seleccionado.facturas }, { label: 'Total', value: seleccionado.totalCompras }, { label: 'Estado', value: seleccionado.estado }].map((s) => <div key={s.label} class="rounded-xl p-3" style={{ background: '#F8FAFC' }}><div class="text-lg font-bold" style={{ color: '#0F172A' }}>{s.value}</div><div class="text-xs" style={{ color: '#94A3B8' }}>{s.label}</div></div>)}</div><div class="p-6"><h4 class="font-bold mb-3" style={{ color: '#0F172A' }}>Historial de compras</h4><div class="space-y-2">{seleccionado.historial.length ? seleccionado.historial.map((h) => <div key={h.id} class="flex items-center justify-between rounded-xl p-3" style={{ background: '#F8FAFC' }}><div class="flex items-center gap-3"><div class="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#E0F2FE' }}><ShoppingBag size={14} style={{ color: '#0369A1' }} /></div><div><div class="text-xs font-bold" style={{ color: '#0F172A' }}>{h.id}</div><div class="text-xs" style={{ color: '#94A3B8' }}>{h.fecha} · {h.productos}</div></div></div><span class="text-sm font-bold" style={{ color: '#38BDF8' }}>{h.monto}</span></div>) : <div class="text-xs p-5 text-center rounded-xl" style={{ background: '#F8FAFC', color: '#94A3B8' }}>Sin compras registradas</div>}</div></div></div> : <div class="p-10 text-center text-sm" style={{ color: '#94A3B8' }}>Selecciona un cliente</div>}
            </div>
          </div>
          {modal.value && <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.5)' }}><div class="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" style={{ background: '#fff' }}><div class="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #F1F5F9' }}><h2 class="font-bold" style={{ color: '#0F172A' }}>{clienteEditando.value ? 'Editar cliente' : 'Agregar cliente'}</h2><button onClick={() => { modal.value = false; form.value = { ...formVacio }; clienteEditando.value = null; }} class="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#F8FAFC' }}><X size={15} style={{ color: '#64748B' }} /></button></div><div class="p-6 space-y-4">{[
            { label: 'Nombre', field: 'nombre' as const }, { label: 'Teléfono', field: 'telefono' as const }, { label: 'Email', field: 'email' as const }, { label: 'Ciudad', field: 'ciudad' as const }, { label: 'RTN', field: 'rtn' as const },
          ].map((f) => <div key={f.field}><label class="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>{f.label}</label><input value={form.value[f.field]} onChange={(e) => (form.value = { ...form.value, [f.field]: (e.target as HTMLInputElement).value })} class="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#111827' }} /></div>)}</div><div class="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid #F1F5F9' }}><button onClick={() => { modal.value = false; form.value = { ...formVacio }; clienteEditando.value = null; }} class="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0' }}>Cancelar</button><button onClick={guardarCliente} class="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: '#0F172A', color: '#fff' }}>{clienteEditando.value ? 'Actualizar cliente' : 'Guardar cliente'}</button></div></div></div>}
        </div>
      );
    };
  },
});
</script>
