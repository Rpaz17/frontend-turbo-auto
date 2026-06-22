<script lang="tsx">
import { defineComponent, ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { Search, FileText, Printer, Eye, X, Calendar, Loader2, Clock, ShoppingCart, Wrench } from 'lucide-vue-next';
import { getFacturas, exportFactura } from '../api/facturas';
import type { Factura } from '../api/schemas';

const ITEMS_PER_PAGE = 8;

function formatFecha(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-HN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function fmt(n: number | undefined | null): string {
  if (n === undefined || n === null || Number.isNaN(n)) return 'L. 0.00';
  return `L. ${n.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`;
}

function calcularTotales(f: Factura) {
  let subtotalProd = 0;
  let isv15 = 0;
  (f.productos ?? []).forEach((p) => {
    const bruto = p.cantidad * Number(p.precio);
    subtotalProd += bruto;
    if (p.isv === 'isv15') isv15 += bruto * 0.15;
  });
  const subtotalServ = (f.servicios ?? []).reduce((acc, s) => acc + Number(s.total), 0);
  const total = subtotalProd + subtotalServ + isv15;
  return { subtotalProd, subtotalServ, isv15, total };
}

export default defineComponent({
  name: 'HistorialVentas',
  setup() {
    const facturas = ref<Factura[]>([]);
    const cargando = ref(false);
    const error = ref<string | null>(null);
    const busqueda = ref('');
    const desde = ref('');
    const hasta = ref('');
    const facturaSelId = ref<string | null>(null);
    const pagina = ref(1);
    const reimprimiendo = ref<string | null>(null);

    const cargarFacturas = async () => {
      cargando.value = true;
      error.value = null;
      try {
        const res = await getFacturas();
        facturas.value = res;
      } catch (e: any) {
        error.value = e?.message || 'No se pudieron cargar las facturas.';
      } finally {
        cargando.value = false;
      }
    };

    onMounted(() => {
      cargarFacturas();
      window.addEventListener('turbo:factura-creada', cargarFacturas);
    });
    onBeforeUnmount(() => {
      window.removeEventListener('turbo:factura-creada', cargarFacturas);
    });

    const facturasFiltradas = computed(() => {
      let list = facturas.value;
      const q = busqueda.value.toLowerCase();
      if (q) {
        list = list.filter((f) =>
          f.numero_factura.toLowerCase().includes(q) ||
          (f.cliente?.nombre ?? '').toLowerCase().includes(q) ||
          (f.rtn_cliente ?? '').toLowerCase().includes(q)
        );
      }
      if (desde.value) {
        list = list.filter((f) => f.fecha_emision >= desde.value);
      }
      if (hasta.value) {
        const end = hasta.value + 'T23:59:59';
        list = list.filter((f) => f.fecha_emision <= end);
      }
      return list.sort((a, b) => new Date(b.fecha_emision).getTime() - new Date(a.fecha_emision).getTime());
    });

    const totalPaginas = computed(() => Math.max(1, Math.ceil(facturasFiltradas.value.length / ITEMS_PER_PAGE)));
    const facturasPaginadas = computed(() => {
      const inicio = (pagina.value - 1) * ITEMS_PER_PAGE;
      return facturasFiltradas.value.slice(inicio, inicio + ITEMS_PER_PAGE);
    });

    const facturaSeleccionada = computed(() =>
      facturaSelId.value ? facturas.value.find((f) => f.id === facturaSelId.value) ?? null : null
    );
    const totalesSel = computed(() => facturaSeleccionada.value ? calcularTotales(facturaSeleccionada.value) : null);

    const seleccionarFactura = (id: string) => {
      facturaSelId.value = id;
      pagina.value = 1;
    };
    const cerrarDetalle = () => { facturaSelId.value = null; };

    const handleReimprimir = async (id: string) => {
      reimprimiendo.value = id;
      try {
        const html = await exportFactura(id);
        const w = window.open();
        if (w) { w.document.write(html); w.document.close(); }
        else { alert('Permita los pop-ups para ver la factura.'); }
      } catch (e: any) {
        alert(`Error al exportar: ${e?.message || e}`);
      } finally {
        reimprimiendo.value = null;
      }
    };

    const irPagina = (p: number) => {
      if (p >= 1 && p <= totalPaginas.value) pagina.value = p;
    };

    const paginasVisibles = computed(() => {
      const total = totalPaginas.value;
      const current = pagina.value;
      const pages: number[] = [];
      if (total <= 5) {
        for (let i = 1; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        const start = Math.max(2, current - 1);
        const end = Math.min(total - 1, current + 1);
        if (start > 2) pages.push(-1);
        for (let i = start; i <= end; i++) pages.push(i);
        if (end < total - 1) pages.push(-1);
        pages.push(total);
      }
      return pages;
    });

    const limpiarFiltros = () => {
      busqueda.value = '';
      desde.value = '';
      hasta.value = '';
      pagina.value = 1;
    };

    return () => (
      <div class="space-y-5">
        {/* Filtros */}
        <div class="rounded-2xl p-5 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.06)' }}>
          <div class="flex flex-wrap gap-4 items-end">
            <div>
              <label class="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Desde</label>
              <div class="relative">
                <Calendar size={13} class="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
                <input type="date" value={desde.value} onChange={(e) => (desde.value = (e.target as HTMLInputElement).value)}
                  class="pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#374151' }} />
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Hasta</label>
              <div class="relative">
                <Calendar size={13} class="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
                <input type="date" value={hasta.value} onChange={(e) => (hasta.value = (e.target as HTMLInputElement).value)}
                  class="pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#374151' }} />
              </div>
            </div>
            <button onClick={() => { pagina.value = 1; }} class="px-4 py-2.5 rounded-xl text-xs font-semibold transition-all"
              style={{ background: '#0F172A', color: '#fff' }}>Aplicar filtros</button>
            <button onClick={limpiarFiltros} class="px-4 py-2.5 rounded-xl text-xs font-semibold transition-all"
              style={{ background: '#F1F5F9', color: '#64748B' }}>Limpiar</button>
          </div>
          <div class="relative mt-4">
            <Search size={15} class="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
            <input value={busqueda.value} onInput={(e) => { busqueda.value = (e.target as HTMLInputElement).value; pagina.value = 1; }}
              placeholder="Buscar por número de factura, cliente o RTN..."
              class="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#111827' }} />
          </div>
        </div>

        {/* Loading / Error */}
        {cargando.value && (
          <div class="flex items-center gap-2 py-4 text-sm" style={{ color: '#94A3B8' }}>
            <Loader2 size={16} class="animate-spin" /> Cargando facturas...
          </div>
        )}
        {error.value && (
          <div class="p-4 rounded-xl text-sm font-semibold" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
            {error.value}
          </div>
        )}

        {/* Master-detail split */}
        {!cargando.value && !error.value && (
          <div class="grid lg:grid-cols-5 gap-5">
            {/* Panel izquierdo: lista */}
            <div class={facturaSelId.value ? 'lg:col-span-3' : 'lg:col-span-5'}>
              <div class="rounded-2xl p-5 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.06)' }}>
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-2">
                    <Clock size={16} style={{ color: '#A78BFA' }} />
                    <h3 class="font-bold" style={{ color: '#0F172A' }}>
                      {facturasFiltradas.value.length} factura{facturasFiltradas.value.length !== 1 ? 's' : ''}
                    </h3>
                  </div>
                  <button onClick={cargarFacturas} class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0' }}>
                    <Loader2 size={12} class={cargando.value ? 'animate-spin' : ''} /> Actualizar
                  </button>
                </div>

                {facturasPaginadas.value.length === 0 ? (
                  <div class="flex flex-col items-center justify-center py-12 rounded-xl" style={{ background: '#F8FAFC', border: '1px dashed #E2E8F0' }}>
                    <FileText size={32} style={{ color: '#CBD5E1' }} />
                    <p class="text-sm mt-2 font-semibold" style={{ color: '#94A3B8' }}>Sin facturas</p>
                    <p class="text-xs mt-1" style={{ color: '#CBD5E1' }}>No se encontraron facturas con los filtros actuales</p>
                  </div>
                ) : (
                  <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                          {['# Factura', 'Fecha', 'Cliente', 'RTN', 'Total', ''].map((h) => (
                            <th key={h} class="text-left pb-2 pr-4 text-xs font-semibold" style={{ color: '#64748B' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {facturasPaginadas.value.map((f) => {
                          const t = calcularTotales(f);
                          const sel = facturaSelId.value === f.id;
                          return (
                            <tr key={f.id} onClick={() => seleccionarFactura(f.id)}
                              class="cursor-pointer transition-colors"
                              style={{ background: sel ? '#F5F3FF' : 'transparent', borderBottom: '1px solid #F8FAFC' }}>
                              <td class="py-2.5 pr-4">
                                <span class="font-semibold text-xs" style={{ color: '#0F172A' }}>{f.numero_factura}</span>
                              </td>
                              <td class="py-2.5 pr-4 text-xs" style={{ color: '#64748B' }}>{formatFecha(f.fecha_emision)}</td>
                              <td class="py-2.5 pr-4 text-xs font-semibold" style={{ color: '#374151' }}>
                                {f.cliente?.nombre ?? (f.rtn_cliente ? 'Contado' : '—')}
                              </td>
                              <td class="py-2.5 pr-4 text-xs" style={{ color: '#94A3B8' }}>{f.rtn_cliente || '—'}</td>
                              <td class="py-2.5 pr-4 text-xs font-bold" style={{ color: '#0F172A' }}>{fmt(t.total)}</td>
                              <td class="py-2.5">
                                <div class="flex items-center gap-1">
                                  <button onClick={(e) => { e.stopPropagation(); seleccionarFactura(f.id); }}
                                    class="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-violet-50"
                                    title="Ver detalle">
                                    <Eye size={13} style={{ color: '#A78BFA' }} />
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); handleReimprimir(f.id); }}
                                    disabled={reimprimiendo.value === f.id}
                                    class="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-blue-50"
                                    title="Reimprimir">
                                    {reimprimiendo.value === f.id
                                      ? <Loader2 size={13} class="animate-spin" style={{ color: '#38BDF8' }} />
                                      : <Printer size={13} style={{ color: '#38BDF8' }} />}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Paginación */}
                {totalPaginas.value > 1 && (
                  <div class="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid #F1F5F9' }}>
                    <span class="text-xs" style={{ color: '#94A3B8' }}>
                      Página {pagina.value} de {totalPaginas.value}
                    </span>
                    <div class="flex gap-1">
                      <button onClick={() => irPagina(pagina.value - 1)} disabled={pagina.value === 1}
                        class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-all disabled:opacity-30"
                        style={{ background: '#F8FAFC', color: '#64748B' }}>◀</button>
                      {paginasVisibles.value.map((p, i) =>
                        p === -1 ? (
                          <span key={`dots-${i}`} class="w-8 h-8 flex items-center justify-center text-xs" style={{ color: '#94A3B8' }}>…</span>
                        ) : (
                          <button key={p} onClick={() => irPagina(p)}
                            class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-all"
                            style={{
                              background: pagina.value === p ? '#A78BFA' : '#F8FAFC',
                              color: pagina.value === p ? '#fff' : '#64748B',
                            }}>{p}</button>
                        )
                      )}
                      <button onClick={() => irPagina(pagina.value + 1)} disabled={pagina.value === totalPaginas.value}
                        class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-all disabled:opacity-30"
                        style={{ background: '#F8FAFC', color: '#64748B' }}>▶</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Panel derecho: detalle */}
            {facturaSeleccionada.value && totalesSel.value && (
              <div class="lg:col-span-2 space-y-4">
                <div class="rounded-2xl p-5 shadow-sm sticky top-6" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.06)' }}>
                  <div class="flex items-center justify-between mb-4">
                    <h3 class="font-bold flex items-center gap-2" style={{ color: '#0F172A' }}>
                      <FileText size={16} style={{ color: '#A78BFA' }} /> Detalle de factura
                    </h3>
                    <button onClick={cerrarDetalle} class="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100">
                      <X size={14} style={{ color: '#94A3B8' }} />
                    </button>
                  </div>

                  <div class="space-y-3">
                    <div>
                      <span class="text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: '#F5F3FF', color: '#A78BFA' }}>
                        {facturaSeleccionada.value.numero_factura}
                      </span>
                    </div>
                    <div class="grid grid-cols-2 gap-2 text-xs">
                      <div><span style={{ color: '#94A3B8' }}>Fecha:</span> <span style={{ color: '#374151' }} class="font-semibold">{formatFecha(facturaSeleccionada.value.fecha_emision)}</span></div>
                      <div><span style={{ color: '#94A3B8' }}>CAI:</span> <span style={{ color: '#374151' }} class="font-semibold text-[10px]">{facturaSeleccionada.value.cai_id?.slice(0, 12)}...</span></div>
                    </div>

                    {facturaSeleccionada.value.cliente && (
                      <div class="p-3 rounded-xl" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                        <p class="text-xs font-bold mb-1" style={{ color: '#374151' }}>Cliente</p>
                        <p class="text-sm font-semibold" style={{ color: '#0F172A' }}>{facturaSeleccionada.value.cliente.nombre}</p>
                        <p class="text-xs" style={{ color: '#64748B' }}>RTN: {facturaSeleccionada.value.cliente.rtn}</p>
                        {facturaSeleccionada.value.cliente.telefono && (
                          <p class="text-xs" style={{ color: '#94A3B8' }}>Tel: {facturaSeleccionada.value.cliente.telefono}</p>
                        )}
                      </div>
                    )}
                    {!facturaSeleccionada.value.cliente && facturaSeleccionada.value.rtn_cliente && (
                      <div class="p-3 rounded-xl" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                        <p class="text-xs font-bold mb-1" style={{ color: '#374151' }}>Cliente</p>
                        <p class="text-xs" style={{ color: '#64748B' }}>RTN: {facturaSeleccionada.value.rtn_cliente}</p>
                      </div>
                    )}
                    {!facturaSeleccionada.value.cliente && !facturaSeleccionada.value.rtn_cliente && (
                      <div class="p-3 rounded-xl" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                        <p class="text-xs" style={{ color: '#94A3B8' }}>Cliente de contado</p>
                      </div>
                    )}

                    {/* Productos */}
                    {(facturaSeleccionada.value.productos?.length ?? 0) > 0 && (
                      <div>
                        <p class="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: '#374151' }}>
                          <ShoppingCart size={12} style={{ color: '#A78BFA' }} /> Productos
                        </p>
                        <div class="space-y-1.5">
                          {facturaSeleccionada.value.productos!.map((p) => {
                            const subtotal = p.cantidad * Number(p.precio);
                            return (
                              <div key={p.id} class="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg" style={{ background: '#F8FAFC' }}>
                                <div class="min-w-0 flex-1">
                                  <p class="font-semibold truncate" style={{ color: '#374151' }}>{p.nombre}</p>
                                  <p style={{ color: '#94A3B8' }}>{p.cantidad} × {fmt(Number(p.precio))} {p.isv ? `(${p.isv})` : ''}</p>
                                </div>
                                <span class="font-bold ml-2" style={{ color: '#0F172A' }}>{fmt(subtotal)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Servicios */}
                    {(facturaSeleccionada.value.servicios?.length ?? 0) > 0 && (
                      <div>
                        <p class="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: '#374151' }}>
                          <Wrench size={12} style={{ color: '#FB923C' }} /> Servicios
                        </p>
                        <div class="space-y-1.5">
                          {facturaSeleccionada.value.servicios!.map((s) => (
                            <div key={s.id} class="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg" style={{ background: '#FFF7ED' }}>
                              <p class="font-semibold truncate flex-1" style={{ color: '#9A3412' }}>{s.descripcion}</p>
                              <span class="font-bold ml-2" style={{ color: '#C2410C' }}>{fmt(Number(s.total))}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Totales */}
                    <div class="pt-3 space-y-1" style={{ borderTop: '2px solid #E2E8F0' }}>
                      {(facturaSeleccionada.value.productos?.length ?? 0) > 0 && (
                        <div class="flex justify-between text-xs">
                          <span style={{ color: '#64748B' }}>Subtotal productos</span>
                          <span style={{ color: '#374151' }} class="font-semibold">{fmt(totalesSel.value!.subtotalProd)}</span>
                        </div>
                      )}
                      {(facturaSeleccionada.value.servicios?.length ?? 0) > 0 && (
                        <div class="flex justify-between text-xs">
                          <span style={{ color: '#64748B' }}>Subtotal servicios</span>
                          <span style={{ color: '#C2410C' }} class="font-semibold">{fmt(totalesSel.value!.subtotalServ)}</span>
                        </div>
                      )}
                      {totalesSel.value!.isv15 > 0 && (
                        <div class="flex justify-between text-xs">
                          <span style={{ color: '#64748B' }}>ISV 15%</span>
                          <span style={{ color: '#374151' }} class="font-semibold">{fmt(totalesSel.value!.isv15)}</span>
                        </div>
                      )}
                      <div class="flex justify-between text-sm pt-1.5" style={{ borderTop: '1px solid #F1F5F9' }}>
                        <span class="font-bold" style={{ color: '#0F172A' }}>Total</span>
                        <span class="font-extrabold" style={{ color: '#0F172A' }}>{fmt(totalesSel.value!.total)}</span>
                      </div>
                    </div>

                    {/* Acciones */}
                    <button onClick={() => handleReimprimir(facturaSeleccionada.value!.id)}
                      disabled={reimprimiendo.value === facturaSeleccionada.value!.id}
                      class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm mt-2"
                      style={{
                        background: reimprimiendo.value ? '#94A3B8' : 'linear-gradient(135deg, #0F172A, #1E3A5F)',
                        color: '#fff',
                        cursor: reimprimiendo.value ? 'not-allowed' : 'pointer',
                      }}>
                      {reimprimiendo.value === facturaSeleccionada.value!.id
                        ? <><Loader2 size={14} class="animate-spin" /> Exportando...</>
                        : <><Printer size={14} /> Reimprimir factura</>}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  },
});
</script>
