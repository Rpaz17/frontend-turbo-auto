<script lang="tsx">
import { defineComponent, ref } from 'vue';
import { Download, TrendingUp, Users, Package, Calendar } from 'lucide-vue-next';
import { store, getVentasEnRango, ventasPorMes, ventasPorCategoria, productosMasVendidos, clientesFrecuentes, formatMoney } from '../store';
import { InteractiveBarChart, InteractivePieChart } from './InteractiveCharts';

export default defineComponent({
  name: 'Reportes',
  setup() {
    const desde = ref('2024-01-01');
    const hasta = ref('2024-07-31');

    return () => {
      const ventas = getVentasEnRango(desde.value, hasta.value);
      const totalVentas = ventas.reduce((a, v) => a + v.total, 0);
      const unidades = ventas.reduce((a, v) => a + v.unidades, 0);
      const clientesUnicos = new Set(ventas.map((v) => v.clienteId)).size;
      const ticketPromedio = totalVentas / Math.max(ventas.length, 1);
      const ventasMensuales = ventasPorMes(ventas);
      const categorias = ventasPorCategoria(ventas);
      const topProductos = productosMasVendidos(ventas);
      const topClientes = clientesFrecuentes(ventas);
      const maxVendidos = Math.max(...topProductos.map((p) => p.vendidos), 1);

      return (
        <div class="space-y-5">
          <div class="rounded-2xl p-5 shadow-sm flex flex-wrap gap-4 items-end justify-between" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.06)' }}>
            <div class="flex flex-wrap gap-4">
              <div><label class="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Desde</label><div class="relative"><Calendar size={13} class="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} /><input type="date" value={desde.value} onChange={(e) => (desde.value = (e.target as HTMLInputElement).value)} class="pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#374151' }} /></div></div>
              <div><label class="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Hasta</label><div class="relative"><Calendar size={13} class="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} /><input type="date" value={hasta.value} onChange={(e) => (hasta.value = (e.target as HTMLInputElement).value)} class="pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#374151' }} /></div></div>
              <div class="self-end"><button class="px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: '#0F172A', color: '#fff' }}>Aplicar filtro</button></div>
            </div>
            <button class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: '#F0F9FF', color: '#38BDF8', border: '1px solid #BAE6FD' }}><Download size={14} /> Exportar reporte</button>
          </div>

          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Ventas totales', value: formatMoney(totalVentas), icon: TrendingUp, color: '#38BDF8' },
              { label: 'Unidades vendidas', value: unidades.toLocaleString('es-HN'), icon: Package, color: '#86EFAC' },
              { label: 'Clientes atendidos', value: clientesUnicos.toString(), icon: Users, color: '#C4B5FD' },
              { label: 'Ticket promedio', value: formatMoney(ticketPromedio), icon: TrendingUp, color: '#FDBA74' },
            ].map((k) => { const Icon = k.icon; return <div key={k.label} class="rounded-2xl p-5 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.06)' }}><div class="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${k.color}18` }}><Icon size={16} style={{ color: k.color }} /></div><div class="text-2xl font-bold mb-0.5" style={{ color: '#0F172A' }}>{k.value}</div><div class="text-xs" style={{ color: '#64748B' }}>{k.label}</div></div>; })}
          </div>

          <div class="grid lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 rounded-2xl p-6 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.06)' }}>
              <h3 class="font-bold mb-5" style={{ color: '#0F172A' }}>Ventas por período</h3>
              <div style={{ height: '230px' }}><InteractiveBarChart data={ventasMensuales} label="Ventas" /></div>
            </div>
            <div class="rounded-2xl p-6 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.06)' }}>
              <h3 class="font-bold mb-5" style={{ color: '#0F172A' }}>Ventas por categoría</h3>
              <div style={{ height: '180px' }}><InteractivePieChart data={categorias} /></div>
              <div class="space-y-2 mt-3">{categorias.map((c) => <div key={c.label} class="flex items-center justify-between"><div class="flex items-center gap-2"><div class="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} /><span class="text-xs" style={{ color: '#64748B' }}>{c.label}</span></div><span class="text-xs font-bold" style={{ color: '#374151' }}>{c.value}%</span></div>)}</div>
            </div>
          </div>

          <div class="grid lg:grid-cols-2 gap-6">
            <div class="rounded-2xl p-6 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.06)' }}>
              <h3 class="font-bold mb-5" style={{ color: '#0F172A' }}>Productos más vendidos</h3>
              <div class="space-y-3">{topProductos.map((p, i) => <div key={p.nombre} class="flex items-center gap-3"><div class="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: i === 0 ? '#38BDF8' : '#F1F5F9', color: i === 0 ? '#fff' : '#64748B' }}>{i + 1}</div><div class="flex-1"><div class="flex items-center justify-between mb-1"><span class="text-xs font-semibold" style={{ color: '#374151' }}>{p.nombre}</span><span class="text-xs font-bold" style={{ color: '#38BDF8' }}>{p.vendidos}</span></div><div class="h-1.5 rounded-full overflow-hidden" style={{ background: '#F1F5F9' }}><div class="h-full rounded-full transition-all" style={{ width: `${(p.vendidos / maxVendidos) * 100}%`, background: i === 0 ? '#38BDF8' : i === 1 ? '#FDBA74' : '#C4B5FD' }} /></div></div></div>)}</div>
            </div>
            <div class="rounded-2xl p-6 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.06)' }}>
              <h3 class="font-bold mb-5" style={{ color: '#0F172A' }}>Clientes frecuentes</h3>
              <div class="space-y-3">{topClientes.map((c) => <div key={c.nombre} class="flex items-center justify-between p-3 rounded-xl" style={{ background: '#F8FAFC' }}><div class="flex items-center gap-3"><div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: '#E0F2FE', color: '#0369A1' }}>{c.nombre.charAt(0)}</div><div><div class="text-xs font-semibold" style={{ color: '#0F172A' }}>{c.nombre}</div><div class="text-xs" style={{ color: '#94A3B8' }}>{c.compras} compras</div></div></div><span class="text-sm font-bold" style={{ color: '#38BDF8' }}>{formatMoney(c.monto)}</span></div>)}</div>
            </div>
          </div>

          <div class="rounded-2xl p-4 text-xs" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#64748B' }}>
            Los gráficos toman sus datos de las ventas, productos, clientes y categorías cargadas en el sistema. Al agregar o editar información, los reportes se recalculan automáticamente.
          </div>
        </div>
      );
    };
  },
});
</script>
