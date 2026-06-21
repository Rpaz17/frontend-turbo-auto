<script lang="tsx">
import { defineComponent, ref, onMounted } from 'vue';
import { Search, Plus, Phone, MapPin, ShoppingBag, X, Edit2, ChevronRight, Trash2 } from 'lucide-vue-next';
import { getClients, createClient, updateClient } from '../api/clientes';
import { getFacturas } from '../api/facturas';
import type { Client } from '../api/schemas';

interface ClienteForm {
  nombre: string;
  telefono: string;
  direccion: string;
  rtn: string;
}
const formVacio: ClienteForm = { nombre: '', telefono: '', direccion: '', rtn: '' };

const soloNumeros = (value: string) => value.replace(/[^0-9]/g, '');

export default defineComponent({
  name: 'Clientes',
  setup() {
    const clientes = ref<Client[]>([]);
    const busqueda = ref('');
    const seleccionadoId = ref<string | null>(null);
    const modal = ref(false);
    const clienteEditando = ref<string | null>(null);
    const form = ref<ClienteForm>({ ...formVacio });
    const cargando = ref(false);
    const guardando = ref(false);
    const error = ref<string | null>(null);
    const errorTelefono = ref('');
    const errorRtn = ref('');

    const historialCliente = ref<any[]>([]);
    const cargandoHistorial = ref(false);

    const cargarClientes = async () => {
      cargando.value = true;
      error.value = null;
      try {
        const data = await getClients();
        clientes.value = data;
        if (!seleccionadoId.value && data.length > 0) {
          seleccionadoId.value = data[0].id;
        }
      } catch (e) {
        console.error('Error cargando clientes:', e);
        error.value = 'No se pudieron cargar los clientes';
      } finally {
        cargando.value = false;
      }
    };

    const cargarHistorial = async (clienteId: string) => {
      cargandoHistorial.value = true;
      try {
        const facturas = await getFacturas({ cliente: clienteId });
        historialCliente.value = facturas;
      } catch (e) {
        console.error('Error cargando historial:', e);
        historialCliente.value = [];
      } finally {
        cargandoHistorial.value = false;
      }
    };

    onMounted(async () => {
      await cargarClientes();
      if (seleccionadoId.value) {
        await cargarHistorial(seleccionadoId.value);
      }
    });

    const seleccionarCliente = async (id: string) => {
      seleccionadoId.value = id;
      await cargarHistorial(id);
    };

    const abrirModalAgregar = () => {
      form.value = { ...formVacio };
      clienteEditando.value = null;
      error.value = null;
      modal.value = true;
    };

    const abrirModalEditar = (cliente: Client) => {
      form.value = {
        nombre: cliente.nombre,
        telefono: cliente.telefono ?? '',
        direccion: cliente.direccion ?? '',
        rtn: cliente.rtn ?? '',
      };
      clienteEditando.value = cliente.id;
      error.value = null;
      modal.value = true;
    };

    const cerrarModal = () => {
      modal.value = false;
      form.value = { ...formVacio };
      clienteEditando.value = null;
    };

    const guardarCliente = async () => {
      if (!form.value.nombre.trim()) {
        error.value = 'El nombre es obligatorio';
        return;
      }
      if (form.value.rtn && form.value.rtn.length !== 14) {
        error.value = 'El RTN debe tener exactamente 14 dígitos';
        return;
      }

      guardando.value = true;
      error.value = null;
      try {
        const payload = {
          nombre: form.value.nombre.trim(),
          telefono: form.value.telefono.trim() || undefined,
          direccion: form.value.direccion.trim() || undefined,
          rtn: form.value.rtn.trim() || undefined,
        };

        if (clienteEditando.value) {
          await updateClient(clienteEditando.value, payload);
        } else {
          await createClient(payload as any);
        }
        cerrarModal();
        await cargarClientes();
      } catch (e) {
        console.error('Error guardando cliente:', e);
        error.value = 'No se pudo guardar el cliente';
      } finally {
        guardando.value = false;
      }
    };

    const desactivarCliente = async (cliente: Client) => {
      if (!confirm('¿Desactivar cliente?')) return;
      try {
        await updateClient(cliente.id, { activo: false });
        await cargarClientes();
        if (seleccionadoId.value === cliente.id) {
          seleccionadoId.value = clientes.value[0]?.id ?? null;
        }
      } catch (e) {
        console.error('Error desactivando cliente:', e);
        error.value = 'No se pudo desactivar el cliente';
      }
    };

    const activarCliente = async (cliente: Client) => {
      try {
        await updateClient(cliente.id, { activo: true });
        await cargarClientes();
      } catch (e) {
        console.error('Error activando cliente:', e);
        error.value = 'No se pudo activar el cliente';
      }
    };

    return () => {
      const filtrados = clientes.value.filter(
        (c) =>
          c.nombre.toLowerCase().includes(busqueda.value.toLowerCase()) ||
          (c.telefono ?? '').includes(busqueda.value) ||
          c.id.toLowerCase().includes(busqueda.value.toLowerCase()),
      );
      const seleccionado = clientes.value.find((c) => c.id === seleccionadoId.value) ?? filtrados[0] ?? null;
      const totalActivos = clientes.value.filter((c) => c.activo).length;

      return (
        <div class="space-y-5">
          {error.value && (
            <div class="rounded-xl px-4 py-3 text-sm font-semibold" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
              {error.value}
            </div>
          )}

          <div class="grid grid-cols-3 gap-4">
            {[
              { label: 'Total clientes', value: clientes.value.length.toLocaleString('es-HN'), color: '#38BDF8' },
              { label: 'Clientes activos', value: totalActivos.toLocaleString('es-HN'), color: '#86EFAC' },
              { label: 'Inactivos', value: (clientes.value.length - totalActivos).toLocaleString('es-HN'), color: '#C4B5FD' },
            ].map((k) => (
              <div key={k.label} class="rounded-2xl px-5 py-4 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.06)' }}>
                <div class="text-2xl font-bold" style={{ color: k.color }}>{k.value}</div>
                <div class="text-xs" style={{ color: '#64748B' }}>{k.label}</div>
              </div>
            ))}
          </div>

          <div class="grid lg:grid-cols-5 gap-5">
            <div class="lg:col-span-2 rounded-2xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.06)' }}>
              <div class="p-5" style={{ borderBottom: '1px solid #F1F5F9' }}>
                <div class="flex gap-3 mb-4">
                  <div class="relative flex-1">
                    <Search size={14} class="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
                    <input
                      value={busqueda.value}
                      onInput={(e) => (busqueda.value = (e.target as HTMLInputElement).value)}
                      placeholder="Buscar por nombre o teléfono..."
                      class="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs outline-none"
                      style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#111827' }}
                    />
                  </div>
                  <button
                    onClick={abrirModalAgregar}
                    class="flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-semibold"
                    style={{ background: '#0F172A', color: '#fff' }}
                  >
                    <Plus size={13} /> Agregar
                  </button>
                </div>
              </div>
              <div class="overflow-y-auto" style={{ maxHeight: '500px' }}>
                {cargando.value ? (
                  <div class="p-5 text-center text-xs" style={{ color: '#94A3B8' }}>Cargando clientes...</div>
                ) : filtrados.length === 0 ? (
                  <div class="p-5 text-center text-xs" style={{ color: '#94A3B8' }}>Sin clientes registrados</div>
                ) : (
                  filtrados.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => seleccionarCliente(c.id)}
                      class="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50"
                      style={{ borderBottom: '1px solid #F8FAFC', background: seleccionado?.id === c.id ? '#F0F9FF' : 'transparent' }}
                    >
                      <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold" style={{ background: '#E0F2FE', color: '#0369A1' }}>
                        {c.nombre.charAt(0)}
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="font-semibold text-sm truncate" style={{ color: '#0F172A' }}>{c.nombre}</div>
                        <div class="text-xs truncate" style={{ color: '#94A3B8' }}>{c.telefono || 'Sin teléfono'}</div>
                      </div>
                      <div class="flex flex-col items-end gap-1">
                        <span class="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: c.activo ? '#F0FDF4' : '#F8FAFC', color: c.activo ? '#16A34A' : '#94A3B8' }}>
                          {c.activo ? 'Activo' : 'Inactivo'}
                        </span>
                        <ChevronRight size={12} style={{ color: '#CBD5E1' }} />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div class="lg:col-span-3 rounded-2xl shadow-sm" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.06)' }}>
              {seleccionado ? (
                <div class="h-full flex flex-col">
                  <div class="p-6" style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <div class="flex items-start justify-between mb-4">
                      <div class="flex items-center gap-4">
                        <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold" style={{ background: '#E0F2FE', color: '#0369A1' }}>
                          {seleccionado.nombre.charAt(0)}
                        </div>
                        <div>
                          <h3 class="font-bold text-lg" style={{ color: '#0F172A' }}>{seleccionado.nombre}</h3>
                          <div class="text-xs font-mono" style={{ color: '#94A3B8' }}>RTN: {seleccionado.rtn || 'No registrado'}</div>
                        </div>
                      </div>
                      <div class="flex gap-2">
                        <button onClick={() => abrirModalEditar(seleccionado)} class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: '#F8FAFC', color: '#374151', border: '1px solid #E2E8F0' }}>
                          <Edit2 size={11} /> Editar
                        </button>
                        {seleccionado.activo ? (
                          <button onClick={() => desactivarCliente(seleccionado)} class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: '#FEF2F2', color: '#F87171', border: '1px solid #FECACA' }}>
                            <Trash2 size={11} /> Desactivar
                          </button>
                        ) : (
                          <button onClick={() => activarCliente(seleccionado)} class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }}>
                            <Plus size={11} /> Activar
                          </button>
                        )}
                      </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                      {[
                        { icon: Phone, text: seleccionado.telefono || 'Sin teléfono' },
                        { icon: MapPin, text: seleccionado.direccion || 'Sin dirección' },
                      ].map((item) => {
                        const Icon = item.icon;
                        return (
                          <div key={item.text} class="flex items-center gap-2 rounded-xl p-3" style={{ background: '#F8FAFC' }}>
                            <Icon size={14} style={{ color: '#38BDF8' }} />
                            <span class="text-xs" style={{ color: '#64748B' }}>{item.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div class="p-6 grid grid-cols-2 gap-3" style={{ borderBottom: '1px solid #F1F5F9' }}>
                    {[
                      { label: 'Compras', value: historialCliente.value.length },
                      { label: 'Estado', value: seleccionado.activo ? 'Activo' : 'Inactivo' },
                    ].map((s) => (
                      <div key={s.label} class="rounded-xl p-3" style={{ background: '#F8FAFC' }}>
                        <div class="text-lg font-bold" style={{ color: '#0F172A' }}>{s.value}</div>
                        <div class="text-xs" style={{ color: '#94A3B8' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  <div class="p-6">
                    <h4 class="font-bold mb-3" style={{ color: '#0F172A' }}>Historial de compras</h4>
                    <div class="space-y-2">
                      {cargandoHistorial.value ? (
                        <div class="text-xs p-5 text-center rounded-xl" style={{ background: '#F8FAFC', color: '#94A3B8' }}>Cargando...</div>
                      ) : historialCliente.value.length === 0 ? (
                        <div class="text-xs p-5 text-center rounded-xl" style={{ background: '#F8FAFC', color: '#94A3B8' }}>Sin compras registradas</div>
                      ) : (
                        historialCliente.value.map((f) => (
                          <div key={f.id} class="flex items-center justify-between rounded-xl p-3" style={{ background: '#F8FAFC' }}>
                            <div class="flex items-center gap-3">
                              <div class="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#E0F2FE' }}>
                                <ShoppingBag size={14} style={{ color: '#0369A1' }} />
                              </div>
                              <div>
                                <div class="text-xs font-bold" style={{ color: '#0F172A' }}>{f.numero_factura}</div>
                                <div class="text-xs" style={{ color: '#94A3B8' }}>{new Date(f.fecha_emision).toLocaleDateString('es-HN')}</div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div class="p-10 text-center text-sm" style={{ color: '#94A3B8' }}>Selecciona un cliente</div>
              )}
            </div>
          </div>

          {modal.value && (
            <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.5)' }}>
              <div class="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" style={{ background: '#fff' }}>
                <div class="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <h2 class="font-bold" style={{ color: '#0F172A' }}>{clienteEditando.value ? 'Editar cliente' : 'Agregar cliente'}</h2>
                  <button onClick={cerrarModal} class="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#F8FAFC' }}>
                    <X size={15} style={{ color: '#64748B' }} />
                  </button>
                </div>
                <div class="p-6 space-y-4">
                  <div>
                    <label class="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Nombre</label>
                    <input
                      value={form.value.nombre}
                      onInput={(e) => (form.value.nombre = (e.target as HTMLInputElement).value)}
                      class="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#111827' }}
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Teléfono</label>
                    <input
                      value={form.value.telefono}
                      inputmode="numeric"
                      maxlength={20}
                      onInput={(e) => {
                        const valorOriginal = (e.target as HTMLInputElement).value;
                        const limpio = soloNumeros(valorOriginal);
                        form.value.telefono = limpio;
                        errorTelefono.value = valorOriginal !== limpio ? 'Solo se permiten números' : '';
                      }}
                      class="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#111827' }}
                    />
                    {errorTelefono.value && (
                      <p class="text-xs mt-1" style={{ color: '#EF4444' }}>{errorTelefono.value}</p>
                    )}
                  </div>
                  <div>
                    <label class="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Dirección</label>
                    <input
                      value={form.value.direccion}
                      onInput={(e) => (form.value.direccion = (e.target as HTMLInputElement).value)}
                      class="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#111827' }}
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>RTN (opcional, 14 dígitos)</label>
                    <input
                      value={form.value.rtn}
                      inputmode="numeric"
                      maxlength={14}
                      onInput={(e) => {
                        const valorOriginal = (e.target as HTMLInputElement).value;
                        const limpio = soloNumeros(valorOriginal);
                        form.value.rtn = limpio;
                        errorRtn.value = valorOriginal !== limpio ? 'Solo se permiten números' : '';
                      }}
                      class="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#111827' }}
                    />
                    {errorRtn.value && (
                      <p class="text-xs mt-1" style={{ color: '#EF4444' }}>{errorRtn.value}</p>
                    )}
                  </div>
                </div>
                <div class="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid #F1F5F9' }}>
                  <button onClick={cerrarModal} class="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0' }}>
                    Cancelar
                  </button>
                  <button disabled={guardando.value} onClick={guardarCliente} class="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60" style={{ background: '#0F172A', color: '#fff' }}>
                    {guardando.value ? 'Guardando...' : clienteEditando.value ? 'Actualizar cliente' : 'Guardar cliente'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    };
  },
});
</script>