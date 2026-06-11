<script lang="tsx">
import { defineComponent, ref, type PropType } from 'vue';
import { TrendingUp, Package, AlertTriangle, Users, FileText, Plus, ShoppingCart, ArrowRight, ArrowUpRight, ArrowDownRight, Flame } from "lucide-vue-next";
import { InteractiveAreaChart } from "./InteractiveCharts";

const ventasData = [
  { label: "Ene", ventas: 38500, compras: 22000 },
  { label: "Feb", ventas: 42000, compras: 24500 },
  { label: "Mar", ventas: 35800, compras: 19800 },
  { label: "Abr", ventas: 51200, compras: 28000 },
  { label: "May", ventas: 48700, compras: 26500 },
  { label: "Jun", ventas: 63400, compras: 33000 },
  { label: "Jul", ventas: 58900, compras: 30200 },
];

const topProductos = [
  { nombre: "Filtro de aceite 5W-30", ventas: 142, ingresos: "L. 14,200", rank: 1 },
  { nombre: "Pastillas freno Bosch", ventas: 98, ingresos: "L. 29,400", rank: 2 },
  { nombre: "Bujías NGK Platinum", ventas: 87, ingresos: "L. 8,700", rank: 3 },
  { nombre: "Batería Willard 12V", ventas: 64, ingresos: "L. 51,200", rank: 4 },
];

const facturasRecientes = [
  { id: "F-2024-0891", cliente: "Roberto Mejía", monto: "L. 3,450", fecha: "01/06/2024", estado: "Pagada" },
  { id: "F-2024-0890", cliente: "Constructora HN", monto: "L. 12,800", fecha: "01/06/2024", estado: "Pagada" },
  { id: "F-2024-0889", cliente: "Taller Morales", monto: "L. 7,200", fecha: "31/05/2024", estado: "Pendiente" },
  { id: "F-2024-0888", cliente: "Carlos Pineda", monto: "L. 1,850", fecha: "31/05/2024", estado: "Pagada" },
  { id: "F-2024-0887", cliente: "Transportes del Norte", monto: "L. 22,500", fecha: "30/05/2024", estado: "Anulada" },
];

const alertas = [
  { tipo: "danger", texto: "Filtro de aceite 5W-30 — stock crítico (2 unid.)", sucursal: "Central" },
  { tipo: "danger", texto: "Aceite Motor Castrol GTX — agotado", sucursal: "Norte" },
  { tipo: "warning", texto: "Pastillas freno Bosch — bajo mínimo (8 unid.)", sucursal: "Central" },
  { tipo: "info", texto: "Bujías NGK — sobrestock (95 unid.)", sucursal: "Sur" },
];

const kpis = [
  {
    label: "Ventas del mes",
    value: "L. 63,400",
    sub: "+18% vs mes anterior",
    trend: "up",
    icon: TrendingUp,
    gradient: "linear-gradient(135deg, #F87171 0%, #FB923C 100%)",
    iconBg: "rgba(255,255,255,0.20)",
    textColor: "#fff",
    subColor: "rgba(255,255,255,0.75)",
    badge: "🔥",
  },
  {
    label: "Productos activos",
    value: "2,418",
    sub: "124 categorías",
    trend: "up",
    icon: Package,
    gradient: "linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)",
    iconBg: "rgba(255,255,255,0.20)",
    textColor: "#fff",
    subColor: "rgba(255,255,255,0.75)",
    badge: null,
  },
  {
    label: "Alertas de stock",
    value: "7",
    sub: "3 críticas · 4 advertencias",
    trend: "down",
    icon: AlertTriangle,
    gradient: "linear-gradient(135deg, #FB923C 0%, #FDBA74 100%)",
    iconBg: "rgba(255,255,255,0.20)",
    textColor: "#fff",
    subColor: "rgba(255,255,255,0.80)",
    badge: null,
  },
  {
    label: "Clientes registrados",
    value: "856",
    sub: "+12 este mes",
    trend: "up",
    icon: Users,
    gradient: "linear-gradient(135deg, #38BDF8 0%, #818CF8 100%)",
    iconBg: "rgba(255,255,255,0.20)",
    textColor: "#fff",
    subColor: "rgba(255,255,255,0.75)",
    badge: null,
  },
  {
    label: "Facturas generadas",
    value: "134",
    sub: "L. 448,200 facturado",
    trend: "up",
    icon: FileText,
    gradient: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
    iconBg: "rgba(56,189,248,0.18)",
    textColor: "#fff",
    subColor: "#94A3B8",
    badge: null,
  },
];

const accesosRapidos = [
  {
    label: "Nueva venta",
    icon: ShoppingCart,
    page: "ventas",
    gradient: "linear-gradient(135deg, #F87171, #FB923C)",
    shadow: "rgba(248,113,113,0.30)",
  },
  {
    label: "Agregar producto",
    icon: Package,
    page: "inventario",
    gradient: "linear-gradient(135deg, #0EA5E9, #38BDF8)",
    shadow: "rgba(56,189,248,0.30)",
  },
  {
    label: "Nuevo cliente",
    icon: Users,
    page: "clientes",
    gradient: "linear-gradient(135deg, #38BDF8, #818CF8)",
    shadow: "rgba(129,140,248,0.30)",
  },
  {
    label: "Ver reportes",
    icon: TrendingUp,
    page: "reportes",
    gradient: "linear-gradient(135deg, #FB923C, #FDBA74)",
    shadow: "rgba(251,146,60,0.30)",
  },
];


export default defineComponent({
  name: 'Dashboard',
  
  emits: ["navigate"],
  setup(props, { emit, slots }) {
  const onNavigate = (page: string) => emit('navigate', page);


    return () => {
      return (
    <div class="space-y-6">
      {/* KPIs */}
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              class="rounded-2xl p-5 shadow-md relative overflow-hidden"
              style={{ background: kpi.gradient }}
            >
              {/* decorative circle */}
              <div
                class="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10"
                style={{ background: "#fff" }}
              />
              <div class="relative">
                <div class="flex items-center justify-between mb-3">
                  <div
                    class="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: kpi.iconBg }}
                  >
                    <Icon size={17} style={{ color: kpi.textColor }} />
                  </div>
                  {kpi.trend === "up" ? (
                    <ArrowUpRight size={14} style={{ color: kpi.subColor }} />
                  ) : (
                    <ArrowDownRight size={14} style={{ color: kpi.textColor }} />
                  )}
                </div>
                <div class="text-2xl font-extrabold mb-0.5" style={{ color: kpi.textColor }}>
                  {kpi.value}
                </div>
                <div class="text-xs font-bold mb-0.5" style={{ color: kpi.textColor }}>
                  {kpi.label}
                </div>
                <div class="text-xs" style={{ color: kpi.subColor }}>
                  {kpi.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div class="grid lg:grid-cols-3 gap-6">
        {/* Gráfico de ventas */}
        <div
          class="lg:col-span-2 rounded-2xl p-6 shadow-sm"
          style={{ background: "#fff", border: "1px solid rgba(15,23,42,0.06)" }}
        >
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="font-bold" style={{ color: "#0F172A" }}>
                Ventas vs Compras
              </h3>
              <p class="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
                Enero – Julio 2024
              </p>
            </div>
            <select
              class="text-xs px-3 py-1.5 rounded-lg outline-none"
              style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#374151" }}
            >
              <option>Últimos 7 meses</option>
              <option>Últimos 3 meses</option>
            </select>
          </div>
          <div style={{ height: "220px" }}>
            <InteractiveAreaChart data={ventasData} />
          </div>
          <div class="flex gap-6 mt-4">
            <div class="flex items-center gap-2 text-xs" style={{ color: "#64748B" }}>
              <div class="w-3 h-3 rounded-full" style={{ background: "#F87171" }} /> Ventas
            </div>
            <div class="flex items-center gap-2 text-xs" style={{ color: "#64748B" }}>
              <div class="w-3 h-3 rounded-full" style={{ background: "#FB923C" }} /> Compras
            </div>
          </div>
        </div>

        {/* Alertas */}
        <div
          class="rounded-2xl p-6 shadow-sm"
          style={{ background: "#fff", border: "1px solid rgba(15,23,42,0.06)" }}
        >
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <div
                class="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#F87171,#FB923C)" }}
              >
                <AlertTriangle size={13} style={{ color: "#fff" }} />
              </div>
              <h3 class="font-bold" style={{ color: "#0F172A" }}>
                Alertas de inventario
              </h3>
            </div>
            <button
              onClick={() => onNavigate("inventario")}
              class="text-xs font-semibold flex items-center gap-1"
              style={{ color: "#FB923C" }}
            >
              Ver todo <ArrowRight size={12} />
            </button>
          </div>
          <div class="space-y-2.5">
            {alertas.map((a, i) => (
              <div
                key={i}
                class="flex items-start gap-3 p-3 rounded-xl"
                style={{
                  background:
                    a.tipo === "danger"
                      ? "#FEF2F2"
                      : a.tipo === "warning"
                      ? "#FFF7ED"
                      : "#F0F9FF",
                  borderLeft: `3px solid ${
                    a.tipo === "danger"
                      ? "#F87171"
                      : a.tipo === "warning"
                      ? "#FB923C"
                      : "#38BDF8"
                  }`,
                  border: `1px solid ${
                    a.tipo === "danger"
                      ? "#FECACA"
                      : a.tipo === "warning"
                      ? "#FED7AA"
                      : "#BAE6FD"
                  }`,
                  borderLeftWidth: "3px",
                }}
              >
                <AlertTriangle
                  size={13}
                  class="mt-0.5 flex-shrink-0"
                  style={{
                    color:
                      a.tipo === "danger"
                        ? "#F87171"
                        : a.tipo === "warning"
                        ? "#FB923C"
                        : "#38BDF8",
                  }}
                />
                <div>
                  <p class="text-xs font-semibold leading-snug" style={{ color: "#374151" }}>
                    {a.texto}
                  </p>
                  <span
                    class="inline-block text-xs px-1.5 py-0.5 rounded mt-1 font-medium"
                    style={{
                      background:
                        a.tipo === "danger"
                          ? "#FECACA"
                          : a.tipo === "warning"
                          ? "#FED7AA"
                          : "#BAE6FD",
                      color:
                        a.tipo === "danger"
                          ? "#B91C1C"
                          : a.tipo === "warning"
                          ? "#92400E"
                          : "#0369A1",
                    }}
                  >
                    Sucursal {a.sucursal}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div class="grid lg:grid-cols-3 gap-6">
        {/* Accesos rápidos */}
        <div
          class="rounded-2xl p-6 shadow-sm"
          style={{ background: "#fff", border: "1px solid rgba(15,23,42,0.06)" }}
        >
          <h3 class="font-bold mb-4" style={{ color: "#0F172A" }}>
            Accesos rápidos
          </h3>
          <div class="grid grid-cols-2 gap-3">
            {accesosRapidos.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.label}
                  onClick={() => onNavigate(a.page)}
                  class="flex flex-col items-center gap-2.5 p-4 rounded-xl transition-all hover:scale-105 text-center"
                  style={{
                    background: a.gradient,
                    boxShadow: `0 4px 14px ${a.shadow}`,
                  }}
                >
                  <div
                    class="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.22)" }}
                  >
                    <Icon size={18} style={{ color: "#fff" }} />
                  </div>
                  <span class="text-xs font-bold" style={{ color: "#fff" }}>
                    {a.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Top productos */}
        <div
          class="rounded-2xl p-6 shadow-sm"
          style={{ background: "#fff", border: "1px solid rgba(15,23,42,0.06)" }}
        >
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <Flame size={15} style={{ color: "#F87171" }} />
              <h3 class="font-bold" style={{ color: "#0F172A" }}>
                Más vendidos
              </h3>
            </div>
            <button
              onClick={() => onNavigate("reportes")}
              class="text-xs font-semibold flex items-center gap-1"
              style={{ color: "#38BDF8" }}
            >
              Ver reportes <ArrowRight size={12} />
            </button>
          </div>
          <div class="space-y-3">
            {topProductos.map((p, i) => {
              const rankColors = ["#F87171", "#FB923C", "#38BDF8", "#94A3B8"];
              return (
                <div key={i} class="flex items-center gap-3">
                  <div
                    class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold flex-shrink-0"
                    style={{ background: `${rankColors[i]}20`, color: rankColors[i] }}
                  >
                    {i + 1}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p
                      class="text-xs font-semibold truncate"
                      style={{ color: "#0F172A" }}
                    >
                      {p.nombre}
                    </p>
                    <p class="text-xs" style={{ color: "#94A3B8" }}>
                      {p.ventas} vendidos
                    </p>
                  </div>
                  <span
                    class="text-xs font-bold flex-shrink-0 px-2 py-0.5 rounded-lg"
                    style={{ background: "#F0FDF4", color: "#15803D" }}
                  >
                    {p.ingresos}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Facturas recientes */}
        <div
          class="rounded-2xl p-6 shadow-sm"
          style={{ background: "#fff", border: "1px solid rgba(15,23,42,0.06)" }}
        >
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <FileText size={15} style={{ color: "#FDBA74" }} />
              <h3 class="font-bold" style={{ color: "#0F172A" }}>
                Facturas recientes
              </h3>
            </div>
            <button
              onClick={() => onNavigate("ventas")}
              class="text-xs font-semibold flex items-center gap-1"
              style={{ color: "#F87171" }}
            >
              Ver todas <ArrowRight size={12} />
            </button>
          </div>
          <div class="space-y-2.5">
            {facturasRecientes.map((f) => {
              const estadoStyle =
                f.estado === "Pagada"
                  ? { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0" }
                  : f.estado === "Pendiente"
                  ? { bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA" }
                  : { bg: "#FEF2F2", text: "#B91C1C", border: "#FECACA" };
              return (
                <div key={f.id} class="flex items-center gap-3">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-bold" style={{ color: "#0F172A" }}>
                        {f.id}
                      </span>
                      <span
                        class="text-xs px-1.5 py-0.5 rounded-md font-semibold"
                        style={{
                          background: estadoStyle.bg,
                          color: estadoStyle.text,
                          border: `1px solid ${estadoStyle.border}`,
                        }}
                      >
                        {f.estado}
                      </span>
                    </div>
                    <p class="text-xs truncate" style={{ color: "#64748B" }}>
                      {f.cliente} · {f.fecha}
                    </p>
                  </div>
                  <span
                    class="text-xs font-bold flex-shrink-0"
                    style={{ color: "#374151" }}
                  >
                    {f.monto}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
    };
  },
});

</script>
