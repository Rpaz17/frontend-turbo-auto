<script lang="tsx">
import { defineComponent, onMounted, ref } from "vue";
import { Download, TrendingUp, Users, Package, Calendar, RefreshCw, Wrench } from "lucide-vue-next";
import { getResumenGeneral } from "../api/reportes";
import { formatMoney } from "../store";
import { InteractiveBarChart } from "./InteractiveCharts";

interface FacturaReporte {
  id: string;
  numero_factura: string;
  fecha_emision: string;
  cliente: string;
  monto_productos: string | number;
  monto_servicios: string | number;
  total: string | number;
}

interface ReporteResumen {
  clientes_frecuentes: any[];
  ventas_por_periodo: {
    facturas?: FacturaReporte[];
    resumen?: Record<string, any>;
  } | null;
  productos_mas_vendidos: any[];
}

const hoy = new Date();
const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
const hoyIso = hoy.toISOString().slice(0, 10);

function n(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function fechaCorta(value: string) {
  return new Date(value).toLocaleDateString("es-HN", { day: "2-digit", month: "short" });
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function descargarCsv(nombre: string, rows: unknown[][]) {
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nombre;
  link.click();
  URL.revokeObjectURL(url);
}

export default defineComponent({
  name: "Reportes",
  setup() {
    const desde = ref(primerDia);
    const hasta = ref(hoyIso);
    const reporte = ref<ReporteResumen | null>(null);
    const cargando = ref(false);
    const error = ref("");

    const cargarReporte = async () => {
      cargando.value = true;
      error.value = "";
      try {
        reporte.value = await getResumenGeneral(desde.value, hasta.value);
      } catch (err) {
        error.value = err instanceof Error ? err.message : "No se pudo cargar el reporte.";
      } finally {
        cargando.value = false;
      }
    };

    onMounted(cargarReporte);

    const exportar = () => {
      const facturas = reporte.value?.ventas_por_periodo?.facturas ?? [];
      descargarCsv(`reporte-${desde.value}-${hasta.value}.csv`, [
        ["Numero factura", "Fecha", "Cliente", "Productos", "Servicios", "Total"],
        ...facturas.map((f) => [
          f.numero_factura,
          new Date(f.fecha_emision).toLocaleString("es-HN"),
          f.cliente,
          n(f.monto_productos).toFixed(2),
          n(f.monto_servicios).toFixed(2),
          n(f.total).toFixed(2),
        ]),
      ]);
    };

    return () => {
      const ventas = reporte.value?.ventas_por_periodo;
      const resumen = ventas?.resumen ?? {};
      const facturas = ventas?.facturas ?? [];
      const totalVentas = n(resumen.monto_bruto);
      const totalFacturas = n(resumen.total_facturas);
      const clientesUnicos = n(resumen.clientes_unicos);
      const ticketPromedio = n(resumen.promedio_por_factura);
      const productos = reporte.value?.productos_mas_vendidos ?? [];
      const clientes = reporte.value?.clientes_frecuentes ?? [];
      const servicios = resumen.servicios_mas_solicitados ?? [];
      const ventasChart = facturas.slice(-8).map((f) => ({
        label: fechaCorta(f.fecha_emision),
        value: n(f.total),
      }));
      const maxProductos = Math.max(...productos.map((p) => n(p.cantidad_total ?? p.total_vendido)), 1);

      return (
        <div class="space-y-5">
          {error.value && <div class="rounded-xl px-4 py-3 text-sm font-semibold" style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C" }}>{error.value}</div>}
          {cargando.value && <div class="rounded-xl px-4 py-3 text-sm font-semibold" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1D4ED8" }}>Cargando reporte desde el backend...</div>}

          <div class="rounded-2xl p-5 shadow-sm flex flex-wrap gap-4 items-end justify-between" style={{ background: "#fff", border: "1px solid rgba(15,23,42,0.06)" }}>
            <div class="flex flex-wrap gap-4">
              {[
                { label: "Desde", value: desde, id: "desde" },
                { label: "Hasta", value: hasta, id: "hasta" },
              ].map((field) => (
                <div key={field.id}>
                  <label class="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>{field.label}</label>
                  <div class="relative">
                    <Calendar size={13} class="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#94A3B8" }} />
                    <input type="date" value={field.value.value} onChange={(e) => (field.value.value = (e.target as HTMLInputElement).value)} class="pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#374151" }} />
                  </div>
                </div>
              ))}
              <button disabled={cargando.value} onClick={cargarReporte} class="self-end flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "#0F172A", color: "#fff" }}><RefreshCw size={14} /> Aplicar</button>
            </div>
            <button disabled={!facturas.length} onClick={exportar} class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: facturas.length ? "#F0F9FF" : "#F8FAFC", color: facturas.length ? "#38BDF8" : "#94A3B8", border: `1px solid ${facturas.length ? "#BAE6FD" : "#E2E8F0"}` }}><Download size={14} /> Exportar CSV</button>
          </div>

          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Ventas totales", value: formatMoney(totalVentas), icon: TrendingUp, color: "#38BDF8" },
              { label: "Facturas emitidas", value: totalFacturas.toLocaleString("es-HN"), icon: Package, color: "#86EFAC" },
              { label: "Clientes atendidos", value: clientesUnicos.toLocaleString("es-HN"), icon: Users, color: "#C4B5FD" },
              { label: "Ticket promedio", value: formatMoney(ticketPromedio), icon: TrendingUp, color: "#FDBA74" },
            ].map((k) => {
              const Icon = k.icon;
              return <div key={k.label} class="rounded-2xl p-5 shadow-sm" style={{ background: "#fff", border: "1px solid rgba(15,23,42,0.06)" }}><div class="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${k.color}18` }}><Icon size={16} style={{ color: k.color }} /></div><div class="text-2xl font-bold mb-0.5" style={{ color: "#0F172A" }}>{k.value}</div><div class="text-xs" style={{ color: "#64748B" }}>{k.label}</div></div>;
            })}
          </div>

          <div class="grid lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 rounded-2xl p-6 shadow-sm" style={{ background: "#fff", border: "1px solid rgba(15,23,42,0.06)" }}>
              <h3 class="font-bold mb-5" style={{ color: "#0F172A" }}>Últimas ventas del período</h3>
              <div style={{ height: "230px" }}>
                <InteractiveBarChart data={ventasChart} label="Total" />
              </div>
            </div>
            <div class="rounded-2xl p-6 shadow-sm" style={{ background: "#fff", border: "1px solid rgba(15,23,42,0.06)" }}>
              <h3 class="font-bold mb-5" style={{ color: "#0F172A" }}>Detalle del período</h3>
              <div class="space-y-3">
                {[
                  { label: "Monto productos", value: formatMoney(n(resumen.monto_productos)), color: "#38BDF8" },
                  { label: "Monto servicios", value: formatMoney(n(resumen.monto_servicios)), color: "#FB923C" },
                  { label: "Factura más alta", value: formatMoney(n(resumen.factura_mas_alta)), color: "#86EFAC" },
                  { label: "Factura más baja", value: formatMoney(n(resumen.factura_mas_baja)), color: "#C4B5FD" },
                ].map((item) => <div key={item.label} class="flex items-center justify-between rounded-xl p-3" style={{ background: "#F8FAFC" }}><span class="text-xs font-semibold" style={{ color: "#64748B" }}>{item.label}</span><span class="text-sm font-bold" style={{ color: item.color }}>{item.value}</span></div>)}
              </div>
            </div>
          </div>

          <div class="grid lg:grid-cols-3 gap-6">
            <div class="rounded-2xl p-6 shadow-sm" style={{ background: "#fff", border: "1px solid rgba(15,23,42,0.06)" }}>
              <h3 class="font-bold mb-5" style={{ color: "#0F172A" }}>Productos más vendidos</h3>
              <div class="space-y-3">
                {productos.map((p, i) => {
                  const cantidad = n(p.cantidad_total ?? p.total_vendido);
                  return <div key={p.nombre} class="flex items-center gap-3"><div class="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: i === 0 ? "#38BDF8" : "#F1F5F9", color: i === 0 ? "#fff" : "#64748B" }}>{i + 1}</div><div class="flex-1"><div class="flex items-center justify-between mb-1"><span class="text-xs font-semibold" style={{ color: "#374151" }}>{p.nombre}</span><span class="text-xs font-bold" style={{ color: "#38BDF8" }}>{cantidad}</span></div><div class="h-1.5 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}><div class="h-full rounded-full transition-all" style={{ width: `${(cantidad / maxProductos) * 100}%`, background: i === 0 ? "#38BDF8" : i === 1 ? "#FDBA74" : "#C4B5FD" }} /></div></div></div>;
                })}
                {!productos.length && <div class="text-xs p-5 text-center rounded-xl" style={{ background: "#F8FAFC", color: "#94A3B8" }}>Sin productos en este período</div>}
              </div>
            </div>

            <div class="rounded-2xl p-6 shadow-sm" style={{ background: "#fff", border: "1px solid rgba(15,23,42,0.06)" }}>
              <h3 class="font-bold mb-5" style={{ color: "#0F172A" }}>Clientes frecuentes</h3>
              <div class="space-y-3">
                {clientes.map((c) => <div key={c.cliente_id ?? c.id ?? c.nombre} class="flex items-center justify-between p-3 rounded-xl" style={{ background: "#F8FAFC" }}><div class="flex items-center gap-3"><div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "#E0F2FE", color: "#0369A1" }}>{c.nombre.charAt(0)}</div><div><div class="text-xs font-semibold" style={{ color: "#0F172A" }}>{c.nombre}</div><div class="text-xs" style={{ color: "#94A3B8" }}>{n(c.total_facturas ?? c.total_compras)} facturas</div></div></div><span class="text-sm font-bold" style={{ color: "#38BDF8" }}>{formatMoney(n(c.monto_total))}</span></div>)}
                {!clientes.length && <div class="text-xs p-5 text-center rounded-xl" style={{ background: "#F8FAFC", color: "#94A3B8" }}>Sin clientes en este período</div>}
              </div>
            </div>

            <div class="rounded-2xl p-6 shadow-sm" style={{ background: "#fff", border: "1px solid rgba(15,23,42,0.06)" }}>
              <h3 class="font-bold mb-5 flex items-center gap-2" style={{ color: "#0F172A" }}><Wrench size={15} style={{ color: "#FB923C" }} /> Servicios facturados</h3>
              <div class="space-y-3">
                {servicios.map((s: any) => <div key={s.descripcion} class="flex items-center justify-between p-3 rounded-xl" style={{ background: "#FFF7ED" }}><div><div class="text-xs font-semibold" style={{ color: "#0F172A" }}>{s.descripcion}</div><div class="text-xs" style={{ color: "#FB923C" }}>{n(s.cantidad)} veces</div></div><span class="text-sm font-bold" style={{ color: "#C2410C" }}>{formatMoney(n(s.monto))}</span></div>)}
                {!servicios.length && <div class="text-xs p-5 text-center rounded-xl" style={{ background: "#F8FAFC", color: "#94A3B8" }}>Sin servicios en este período</div>}
              </div>
            </div>
          </div>
        </div>
      );
    };
  },
});
</script>
