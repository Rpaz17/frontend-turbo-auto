<script lang="tsx">
import { defineComponent, onBeforeUnmount, onMounted, ref } from "vue";
import { Download, FileText, TrendingUp, Users, Package, Calendar, RefreshCw, Wrench } from "lucide-vue-next";
import { getResumenGeneral } from "../api/reportes";
import { formatMoney } from "../store";
import { InteractiveBarChart } from "./InteractiveCharts";
import logoUrl from "../assets/turbo-auto-logo.png";

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

function html(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function abrirPdfReporte({
  desde,
  hasta,
  resumen,
  facturas,
  productos,
  clientes,
  servicios,
}: {
  desde: string;
  hasta: string;
  resumen: Record<string, any>;
  facturas: FacturaReporte[];
  productos: any[];
  clientes: any[];
  servicios: any[];
}) {
  const totalVentas = n(resumen.monto_bruto);
  const totalFacturas = n(resumen.total_facturas);
  const clientesUnicos = n(resumen.clientes_unicos);
  const ticketPromedio = n(resumen.promedio_por_factura);
  const fechaGeneracion = new Date().toLocaleString("es-HN");
  const topClientes = clientes.slice(0, 3);

  const rows = facturas.map((f) => `
    <tr>
      <td>${html(f.numero_factura)}</td>
      <td>${html(new Date(f.fecha_emision).toLocaleDateString("es-HN"))}</td>
      <td>${html(f.cliente)}</td>
      <td class="num">${html(formatMoney(n(f.monto_productos)))}</td>
      <td class="num">${html(formatMoney(n(f.monto_servicios)))}</td>
      <td class="num strong">${html(formatMoney(n(f.total)))}</td>
    </tr>
  `).join("");

  const doc = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Reporte de ventas ${html(desde)} - ${html(hasta)}</title>
  <style>
    @page { size: letter; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 14mm; font-family: Arial, sans-serif; color: #0f172a; background: #fff; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 18px; }
    .brand-wrap { display: flex; align-items: center; gap: 10px; }
    .logo { width: 42px; height: 42px; object-fit: contain; }
    .brand { font-size: 22px; font-weight: 800; letter-spacing: .2px; }
    .subtitle { color: #64748b; font-size: 12px; margin-top: 4px; }
    .meta { text-align: right; font-size: 11px; color: #64748b; line-height: 1.5; }
    h2 { font-size: 14px; margin: 18px 0 10px; }
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
    .kpi { border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; background: #f8fafc; }
    .kpi .label { color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase; }
    .kpi .value { font-size: 17px; font-weight: 800; margin-top: 6px; color: #0f172a; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; align-items: start; }
    .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; break-inside: avoid; }
    .rank { display: grid; gap: 8px; }
    .rank-item { display: grid; grid-template-columns: 24px 1fr auto; gap: 8px; align-items: center; padding: 8px; border-radius: 9px; background: #f8fafc; }
    .rank-num { width: 24px; height: 24px; border-radius: 999px; display: flex; align-items: center; justify-content: center; background: #e0f2fe; color: #0369a1; font-size: 11px; font-weight: 800; }
    .rank-title { font-size: 11px; font-weight: 700; }
    .rank-sub { font-size: 10px; color: #64748b; margin-top: 2px; }
    .rank-value { font-size: 11px; font-weight: 800; color: #0369a1; white-space: nowrap; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10.5px; }
    th { text-align: left; background: #0f172a; color: #fff; padding: 8px; font-size: 10px; }
    td { border-bottom: 1px solid #e2e8f0; padding: 7px 8px; vertical-align: top; }
    .num { text-align: right; white-space: nowrap; }
    .strong { font-weight: 800; }
    .empty { color: #94a3b8; font-size: 11px; padding: 10px; border-radius: 9px; background: #f8fafc; text-align: center; }
    .footer { margin-top: 18px; padding-top: 10px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 10px; text-align: center; }
    .print-actions { margin-top: 18px; display: flex; justify-content: center; }
    .print-button { border: 0; border-radius: 10px; background: #0f172a; color: #fff; padding: 11px 18px; font-size: 12px; font-weight: 800; cursor: pointer; box-shadow: 0 8px 18px rgba(15, 23, 42, .18); }
    .print-button:hover { background: #1e293b; }
    @media print { .no-print { display: none; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand-wrap">
        <img class="logo" src="${html(logoUrl)}" alt="Turbo Auto F&amp;M 504" />
        <div>
          <div class="brand">Turbo Auto F&amp;M 504</div>
          <div class="subtitle">Reporte de ventas e inventario facturado</div>
        </div>
      </div>
    </div>
    <div class="meta">
      <div><strong>Periodo:</strong> ${html(desde)} al ${html(hasta)}</div>
      <div><strong>Generado:</strong> ${html(fechaGeneracion)}</div>
    </div>
  </div>

  <div class="kpis">
    <div class="kpi"><div class="label">Ventas totales</div><div class="value">${html(formatMoney(totalVentas))}</div></div>
    <div class="kpi"><div class="label">Facturas</div><div class="value">${html(totalFacturas.toLocaleString("es-HN"))}</div></div>
    <div class="kpi"><div class="label">Clientes</div><div class="value">${html(clientesUnicos.toLocaleString("es-HN"))}</div></div>
    <div class="kpi"><div class="label">Ticket promedio</div><div class="value">${html(formatMoney(ticketPromedio))}</div></div>
  </div>

  <div class="grid">
    <div class="card">
      <h2>Productos más vendidos</h2>
      <div class="rank">
        ${productos.length ? productos.slice(0, 5).map((p, i) => `
          <div class="rank-item"><div class="rank-num">${i + 1}</div><div><div class="rank-title">${html(p.nombre)}</div><div class="rank-sub">unidades vendidas</div></div><div class="rank-value">${html(n(p.cantidad_total ?? p.total_vendido).toLocaleString("es-HN"))}</div></div>
        `).join("") : `<div class="empty">Sin productos en este período</div>`}
      </div>
    </div>
    <div class="card">
      <h2>Clientes frecuentes</h2>
      <div class="rank">
        ${topClientes.length ? topClientes.map((c, i) => `
          <div class="rank-item"><div class="rank-num">${i + 1}</div><div><div class="rank-title">${html(c.nombre)}</div><div class="rank-sub">${html(n(c.total_facturas ?? c.total_compras))} facturas</div></div><div class="rank-value">${html(formatMoney(n(c.monto_total)))}</div></div>
        `).join("") : `<div class="empty">Sin clientes en este período</div>`}
      </div>
    </div>
    <div class="card">
      <h2>Servicios facturados</h2>
      <div class="rank">
        ${servicios.length ? servicios.map((s: any, i: number) => `
          <div class="rank-item"><div class="rank-num">${i + 1}</div><div><div class="rank-title">${html(s.descripcion)}</div><div class="rank-sub">${html(n(s.cantidad))} veces</div></div><div class="rank-value">${html(formatMoney(n(s.monto)))}</div></div>
        `).join("") : `<div class="empty">Sin servicios en este período</div>`}
      </div>
    </div>
  </div>

  <h2>Detalle de facturas</h2>
  <table>
    <thead>
      <tr><th>Factura</th><th>Fecha</th><th>Cliente</th><th>Productos</th><th>Servicios</th><th>Total</th></tr>
    </thead>
    <tbody>${rows || `<tr><td colspan="6" class="empty">Sin facturas en este período</td></tr>`}</tbody>
  </table>
  <div class="footer">Reporte generado desde Turbo Auto F&amp;M 504</div>
  <div class="print-actions no-print">
    <button class="print-button" type="button" onclick="window.print()">Imprimir / Exportar a PDF</button>
  </div>
  <script>
    window.addEventListener("load", () => {
      setTimeout(() => window.print(), 250);
    });
  <\/script>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("No se pudo abrir la ventana de impresión. Permite las ventanas emergentes para exportar el PDF.");
    return;
  }
  printWindow.document.open();
  printWindow.document.write(doc);
  printWindow.document.close();
}

function PodioRanking({
  items,
  emptyText,
  getKey,
  getTitle,
  getSubtitle,
  getValue,
  valueColor = "#38BDF8",
}: {
  items: any[];
  emptyText: string;
  getKey: (item: any) => string;
  getTitle: (item: any) => string;
  getSubtitle: (item: any) => string;
  getValue: (item: any) => string;
  valueColor?: string;
}) {
  const podium = items.slice(0, 3);
  const rest = items.slice(3);
  const podiumStyles = [
    { bg: "#E0F2FE", color: "#0369A1", border: "#BAE6FD" },
    { bg: "#FFF7ED", color: "#C2410C", border: "#FDBA74" },
    { bg: "#F3E8FF", color: "#7E22CE", border: "#E9D5FF" },
  ];

  if (!items.length) {
    return <div class="text-xs p-5 text-center rounded-xl" style={{ background: "#F8FAFC", color: "#94A3B8" }}>{emptyText}</div>;
  }

  return (
    <div class="space-y-4">
      <div class="grid grid-cols-3 gap-2 items-end">
        {podium.map((item, i) => {
          const style = podiumStyles[i];
          return (
            <div key={getKey(item)} class="rounded-xl p-3 text-center" style={{ background: style.bg, border: `1px solid ${style.border}` }}>
              <div class="mx-auto mb-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold" style={{ background: "#fff", color: style.color }}>{i + 1}</div>
              <div class="text-xs font-bold leading-tight line-clamp-2" style={{ color: "#0F172A" }}>{getTitle(item)}</div>
              <div class="text-[11px] mt-1" style={{ color: "#64748B" }}>{getSubtitle(item)}</div>
              <div class="text-sm font-extrabold mt-2" style={{ color: style.color }}>{getValue(item)}</div>
            </div>
          );
        })}
      </div>
      {rest.length > 0 && (
        <div class="space-y-2">
          {rest.map((item, idx) => (
            <div key={getKey(item)} class="flex items-center justify-between p-3 rounded-xl" style={{ background: "#F8FAFC" }}>
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: "#E2E8F0", color: "#64748B" }}>{idx + 4}</div>
                <div class="min-w-0">
                  <div class="text-xs font-semibold truncate" style={{ color: "#0F172A" }}>{getTitle(item)}</div>
                  <div class="text-xs truncate" style={{ color: "#94A3B8" }}>{getSubtitle(item)}</div>
                </div>
              </div>
              <span class="text-sm font-bold flex-shrink-0" style={{ color: valueColor }}>{getValue(item)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
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

    onMounted(() => {
      cargarReporte();
      window.addEventListener("turbo:factura-creada", cargarReporte);
    });

    onBeforeUnmount(() => {
      window.removeEventListener("turbo:factura-creada", cargarReporte);
    });

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

    const exportarPdf = () => {
      const ventas = reporte.value?.ventas_por_periodo;
      const resumen = ventas?.resumen ?? {};
      abrirPdfReporte({
        desde: desde.value,
        hasta: hasta.value,
        resumen,
        facturas: ventas?.facturas ?? [],
        productos: reporte.value?.productos_mas_vendidos ?? [],
        clientes: reporte.value?.clientes_frecuentes ?? [],
        servicios: resumen.servicios_mas_solicitados ?? [],
      });
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
            <div class="flex flex-wrap gap-2">
              <button disabled={!reporte.value} onClick={exportarPdf} class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: reporte.value ? "#0F172A" : "#F8FAFC", color: reporte.value ? "#fff" : "#94A3B8", border: `1px solid ${reporte.value ? "#0F172A" : "#E2E8F0"}` }}><FileText size={14} /> Exportar PDF</button>
              <button disabled={!facturas.length} onClick={exportar} class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: facturas.length ? "#F0F9FF" : "#F8FAFC", color: facturas.length ? "#38BDF8" : "#94A3B8", border: `1px solid ${facturas.length ? "#BAE6FD" : "#E2E8F0"}` }}><Download size={14} /> Exportar CSV</button>
            </div>
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
            <div class="rounded-2xl p-6 shadow-sm h-[245px] flex flex-col" style={{ background: "#fff", border: "1px solid rgba(15,23,42,0.06)" }}>
              <h3 class="font-bold mb-5" style={{ color: "#0F172A" }}>Productos más vendidos</h3>
              <PodioRanking
                items={productos}
                emptyText="Sin productos en este período"
                getKey={(p) => p.id ?? p.nombre}
                getTitle={(p) => p.nombre}
                getSubtitle={(p) => "unidades vendidas"}
                getValue={(p) => n(p.cantidad_total ?? p.total_vendido).toLocaleString("es-HN")}
              />
            </div>

            <div class="rounded-2xl p-6 shadow-sm h-[245px] flex flex-col" style={{ background: "#fff", border: "1px solid rgba(15,23,42,0.06)" }}>
              <h3 class="font-bold mb-5" style={{ color: "#0F172A" }}>Clientes frecuentes</h3>
              <PodioRanking
                items={clientes.slice(0, 3)}
                emptyText="Sin clientes en este período"
                getKey={(c) => c.cliente_id ?? c.id ?? c.nombre}
                getTitle={(c) => c.nombre}
                getSubtitle={(c) => `${n(c.total_facturas ?? c.total_compras)} facturas`}
                getValue={(c) => formatMoney(n(c.monto_total))}
                valueColor="#38BDF8"
              />
            </div>

            <div class="rounded-2xl p-6 shadow-sm h-[245px] flex flex-col" style={{ background: "#fff", border: "1px solid rgba(15,23,42,0.06)" }}>
              <h3 class="font-bold mb-4 flex items-center gap-2" style={{ color: "#0F172A" }}><Wrench size={15} style={{ color: "#FB923C" }} /> Servicios facturados</h3>
              <div class="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1">
                {servicios.map((s: any) => <div key={s.descripcion} class="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: "#FFF7ED" }}><div><div class="text-xs font-semibold" style={{ color: "#0F172A" }}>{s.descripcion}</div><div class="text-xs" style={{ color: "#FB923C" }}>{n(s.cantidad)} veces</div></div><span class="text-sm font-bold" style={{ color: "#C2410C" }}>{formatMoney(n(s.monto))}</span></div>)}
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
