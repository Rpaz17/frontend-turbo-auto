<script lang="tsx">
import { defineComponent, ref, onMounted } from 'vue';
import { TrendingUp, Package, Users, FileText, ShoppingCart, ArrowRight, ArrowUpRight, Flame, RefreshCw } from "lucide-vue-next";
import { InteractiveBarChart } from "./InteractiveCharts";
import { getResumenGeneral } from '../api';
import { formatMoney } from '../store';

interface FacturaReporte {
  fecha_emision: string;
  total: string | number;
}

interface ReporteResumen {
  clientes_frecuentes: Array<{
    cliente_id?: string;
    id?: string;
    nombre: string;
    total_facturas?: number;
    total_compras?: number;
    monto_total?: string | number;
  }>;
  ventas_por_periodo: {
    facturas?: FacturaReporte[];
    resumen?: {
      monto_bruto?: string | number;
      total_facturas?: number;
      clientes_unicos?: number;
      promedio_por_factura?: string | number;
      monto_productos?: string | number;
      monto_servicios?: string | number;
      factura_mas_alta?: string | number;
      factura_mas_baja?: string | number;
      servicios_mas_solicitados?: Array<{
        descripcion: string;
        cantidad: string | number;
        monto: string | number;
      }>;
    };
  } | null;
  productos_mas_vendidos: Array<{
    id?: string;
    nombre: string;
    cantidad_total?: number;
    total_vendido?: number;
  }>;
}

type ProductoMasVendido = ReporteResumen['productos_mas_vendidos'][number];

export default defineComponent({
  name: 'Dashboard',
  emits: ["navigate"],
  setup(props, { emit }) {
    const onNavigate = (page: string) => emit('navigate', page);

    const toYmd = (value: Date) => {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    const getDashboardRange = () => {
      const now = new Date();
      const desdeDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      return {
        desde: toYmd(desdeDate),
        hasta: toYmd(now),
      };
    };

    const numberFromMoney = (value: unknown): number => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const clean = value.replace(/,/g, '').replace(/[^0-9.-]/g, '');
        const parsed = Number.parseFloat(clean);
        return Number.isFinite(parsed) ? parsed : 0;
      }
      return 0;
    };

    const n = (value: unknown): number => numberFromMoney(value);

    const buildMonthlySales = (facturas: Array<{ fecha_emision?: string; total?: string | number }>) => {
      const map = new Map<string, number>();
      for (const factura of facturas) {
        if (!factura?.fecha_emision) continue;
        const date = new Date(factura.fecha_emision);
        if (Number.isNaN(date.getTime())) continue;
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        const monto = numberFromMoney(factura.total ?? '0');
        map.set(key, (map.get(key) ?? 0) + monto);
      }

      return Array.from(map.entries())
        .sort((a, b) => {
          const [ay, am] = a[0].split('-').map(Number);
          const [by, bm] = b[0].split('-').map(Number);
          return ay === by ? am - bm : ay - by;
        })
        .map(([key, total]) => {
          const [year, month] = key.split('-').map(Number);
          return {
            label: `${meses[month]} ${String(year).slice(-2)}`,
            value: total,
          };
        });
    };

    const topProductos = ref<ProductoMasVendido[]>([]);
    const resumenVentas = ref<ReporteResumen['ventas_por_periodo']>(null);
    const clientesFrecuentes = ref<ReporteResumen['clientes_frecuentes']>([]);
    const ventasMensuales = ref<Array<{ label: string; value: number }>>([]);
    const topServicios = ref<Array<{ descripcion: string; cantidad: number; monto: number }>>([]);
    const cargando = ref(false);
    const error = ref<string | null>(null);
    const ultimaActualizacion = ref<string | null>(null);

    const cargarDashboard = async () => {
      const { desde, hasta } = getDashboardRange();
      cargando.value = true;
      error.value = null;
      try {
        const res = await getResumenGeneral(desde, hasta) as ReporteResumen;
        topProductos.value = res.productos_mas_vendidos ?? [];
        resumenVentas.value = res.ventas_por_periodo ?? null;
        clientesFrecuentes.value = res.clientes_frecuentes ?? [];
        ventasMensuales.value = buildMonthlySales(resumenVentas.value?.facturas ?? []);
        topServicios.value = (resumenVentas.value?.resumen?.servicios_mas_solicitados ?? []).map((servicio) => ({
          ...servicio,
          cantidad: n(servicio.cantidad),
          monto: n(servicio.monto),
        }));
        ultimaActualizacion.value = new Date().toLocaleTimeString('es-HN', {
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch (e) {
        console.error('Error cargando datos del dashboard:', e);
        error.value = 'No se pudieron cargar los datos del dashboard';
      } finally {
        cargando.value = false;
      }
    };

    onMounted(cargarDashboard);

    const accesosRapidos = [
      { label: "Nueva venta", icon: ShoppingCart, page: "ventas", gradient: "linear-gradient(135deg, #F87171, #FB923C)", shadow: "rgba(248,113,113,0.30)" },
      { label: "Agregar producto", icon: Package, page: "inventario", gradient: "linear-gradient(135deg, #0EA5E9, #38BDF8)", shadow: "rgba(56,189,248,0.30)" },
      { label: "Nuevo cliente", icon: Users, page: "clientes", gradient: "linear-gradient(135deg, #38BDF8, #818CF8)", shadow: "rgba(129,140,248,0.30)" },
      { label: "Ver reportes", icon: TrendingUp, page: "reportes", gradient: "linear-gradient(135deg, #FB923C, #FDBA74)", shadow: "rgba(251,146,60,0.30)" },
    ];

    return () => {
      const kpis = [
        {
          label: "Ventas del mes",
          value: resumenVentas.value ? formatMoney(n(resumenVentas.value.resumen?.monto_bruto ?? 0)) : "L. 0.00",
          sub: resumenVentas.value ? `${resumenVentas.value.resumen?.total_facturas ?? 0} facturas` : "Sin datos",
          trend: "up",
          icon: TrendingUp,
          gradient: "linear-gradient(135deg, #F87171 0%, #FB923C 100%)",
          iconBg: "rgba(255,255,255,0.20)",
          textColor: "#fff",
          subColor: "rgba(255,255,255,0.75)",
        },
        {
          label: "Clientes únicos",
          value: resumenVentas.value ? String(resumenVentas.value.resumen?.clientes_unicos ?? 0) : "0",
          sub: "en el período",
          trend: "up",
          icon: Users,
          gradient: "linear-gradient(135deg, #38BDF8 0%, #818CF8 100%)",
          iconBg: "rgba(255,255,255,0.20)",
          textColor: "#fff",
          subColor: "rgba(255,255,255,0.75)",
        },
        {
          label: "Facturas del período",
          value: resumenVentas.value ? String(resumenVentas.value.resumen?.total_facturas ?? 0) : "0",
          sub: resumenVentas.value ? `Promedio ${formatMoney(n(resumenVentas.value.resumen?.promedio_por_factura ?? 0))}` : "Sin datos",
          trend: "up",
          icon: FileText,
          gradient: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
          iconBg: "rgba(56,189,248,0.18)",
          textColor: "#fff",
          subColor: "#94A3B8",
        },
        {
          label: "Top productos",
          value: String(topProductos.value.length),
          sub: "con ventas registradas",
          trend: "up",
          icon: Package,
          gradient: "linear-gradient(135deg, #FB923C 0%, #FDBA74 100%)",
          iconBg: "rgba(255,255,255,0.20)",
          textColor: "#fff",
          subColor: "rgba(255,255,255,0.80)",
        },
      ];

      return (
        <div class="space-y-6">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="text-lg font-extrabold" style={{ color: "#0F172A" }}>Panel general</h2>
              <p class="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
                {ultimaActualizacion.value ? `Actualizado ${ultimaActualizacion.value}` : "Datos de los últimos 6 meses"}
              </p>
            </div>
            <button
              type="button"
              disabled={cargando.value}
              onClick={cargarDashboard}
              class="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-60"
              style={{ background: "#F8FAFC", color: "#0F172A", border: "1px solid #E2E8F0" }}
            >
              <RefreshCw size={14} class={cargando.value ? "animate-spin" : ""} />
              Actualizar
            </button>
          </div>

          {cargando.value && (
            <div class="text-center py-4 text-sm" style={{ color: "#94A3B8" }}>
              Cargando datos...
            </div>
          )}

          {error.value && (
            <div class="text-center py-4 text-sm" style={{ color: "#F87171" }}>
              {error.value}
            </div>
          )}

          {/* KPIs */}
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div key={kpi.label} class="rounded-2xl p-5 shadow-md relative overflow-hidden" style={{ background: kpi.gradient }}>
                  <div class="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10" style={{ background: "#fff" }} />
                  <div class="relative">
                    <div class="flex items-center justify-between mb-3">
                      <div class="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: kpi.iconBg }}>
                        <Icon size={17} style={{ color: kpi.textColor }} />
                      </div>
                      <ArrowUpRight size={14} style={{ color: kpi.subColor }} />
                    </div>
                    <div class="text-2xl font-extrabold mb-0.5" style={{ color: kpi.textColor }}>{kpi.value}</div>
                    <div class="text-xs font-bold mb-0.5" style={{ color: kpi.textColor }}>{kpi.label}</div>
                    <div class="text-xs" style={{ color: kpi.subColor }}>{kpi.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div class="grid lg:grid-cols-3 gap-6">
            {/* Gráfico */}
            <div class="lg:col-span-2 rounded-2xl p-6 shadow-sm" style={{ background: "#fff", border: "1px solid rgba(15,23,42,0.06)" }}>
              <div class="flex items-center justify-between mb-6">
                <div>
                  <h3 class="font-bold" style={{ color: "#0F172A" }}>Ventas mensuales</h3>
                  <p class="text-xs mt-0.5" style={{ color: "#94A3B8" }}>Últimos 6 meses</p>
                </div>
              </div>
              <div style={{ height: "220px" }}>
                {ventasMensuales.value.length === 0 ? (
                  <div class="flex items-center justify-center h-full">
                    <p class="text-xs" style={{ color: "#94A3B8" }}>Sin datos en el período</p>
                  </div>
                ) : (
                  <InteractiveBarChart data={ventasMensuales.value} label="Ventas" color="#F87171" />
                )}
              </div>
            </div>

            {/* Servicios más solicitados */}
            <div class="rounded-2xl p-6 shadow-sm" style={{ background: "#fff", border: "1px solid rgba(15,23,42,0.06)" }}>
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                  <Flame size={14} style={{ color: "#FB923C" }} />
                  <h3 class="font-bold" style={{ color: "#0F172A" }}>Servicios más solicitados</h3>
                </div>
                <button onClick={() => onNavigate("reportes")} class="text-xs font-semibold flex items-center gap-1" style={{ color: "#FB923C" }}>
                  Ver reportes <ArrowRight size={12} />
                </button>
              </div>
              <div class="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {cargando.value ? (
                  <p class="text-xs" style={{ color: "#94A3B8" }}>Cargando...</p>
                ) : topServicios.value.length === 0 ? (
                  <p class="text-xs" style={{ color: "#94A3B8" }}>Sin datos en el período</p>
                ) : (
                  topServicios.value.slice(0, 4).map((servicio, i) => (
                    <div key={i} class="flex items-start gap-3 p-3 rounded-xl" style={{ background: "#FFF7ED", borderLeft: "3px solid #FB923C" }}>
                      <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: "#FED7AA", color: "#9A3412" }}>
                        {i + 1}
                      </div>
                      <div class="min-w-0">
                        <p class="text-xs font-semibold leading-snug truncate" style={{ color: "#374151" }}>{servicio.descripcion}</p>
                        <p class="text-xs" style={{ color: "#9A3412" }}>
                          {servicio.cantidad} servicios · {formatMoney(servicio.monto)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div class="grid lg:grid-cols-3 gap-6">
            {/* Accesos rápidos */}
            <div class="rounded-2xl p-6 shadow-sm" style={{ background: "#fff", border: "1px solid rgba(15,23,42,0.06)" }}>
              <h3 class="font-bold mb-4" style={{ color: "#0F172A" }}>Accesos rápidos</h3>
              <div class="grid grid-cols-2 gap-3">
                {accesosRapidos.map((a) => {
                  const Icon = a.icon;
                  return (
                    <button key={a.label} onClick={() => onNavigate(a.page)} class="flex flex-col items-center gap-2.5 p-4 rounded-xl transition-all hover:scale-105 text-center" style={{ background: a.gradient, boxShadow: `0 4px 14px ${a.shadow}` }}>
                      <div class="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.22)" }}>
                        <Icon size={18} style={{ color: "#fff" }} />
                      </div>
                      <span class="text-xs font-bold" style={{ color: "#fff" }}>{a.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Top productos */}
            <div class="rounded-2xl p-6 shadow-sm" style={{ background: "#fff", border: "1px solid rgba(15,23,42,0.06)" }}>
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                  <Flame size={15} style={{ color: "#F87171" }} />
                  <h3 class="font-bold" style={{ color: "#0F172A" }}>Más vendidos</h3>
                </div>
                <button onClick={() => onNavigate("reportes")} class="text-xs font-semibold flex items-center gap-1" style={{ color: "#38BDF8" }}>
                  Ver reportes <ArrowRight size={12} />
                </button>
              </div>
              <div class="space-y-3 max-h-72 overflow-y-auto pr-1">
                {cargando.value ? (
                  <p class="text-xs" style={{ color: "#94A3B8" }}>Cargando...</p>
                ) : topProductos.value.length === 0 ? (
                  <p class="text-xs" style={{ color: "#94A3B8" }}>Sin datos en el período</p>
                ) : (
                  topProductos.value.slice(0, 5).map((p, i) => {
                    const rankColors = ["#F87171", "#FB923C", "#38BDF8", "#94A3B8", "#818CF8"];
                    const color = rankColors[i % rankColors.length];
                    return (
                      <div key={i} class="flex items-center gap-3">
                        <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold flex-shrink-0" style={{ background: `${color}20`, color }}>
                          {i + 1}
                        </div>
                        <div class="flex-1 min-w-0">
                          <p class="text-xs font-semibold truncate" style={{ color: "#0F172A" }}>{p.nombre}</p>
                            <p class="text-xs" style={{ color: "#94A3B8" }}>{(p.cantidad_total ?? p.total_vendido ?? 0)} vendidos</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Clientes frecuentes */}
            <div class="rounded-2xl p-6 shadow-sm" style={{ background: "#fff", border: "1px solid rgba(15,23,42,0.06)" }}>
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                  <Users size={15} style={{ color: "#818CF8" }} />
                  <h3 class="font-bold" style={{ color: "#0F172A" }}>Clientes frecuentes</h3>
                </div>
                <button onClick={() => onNavigate("reportes")} class="text-xs font-semibold flex items-center gap-1" style={{ color: "#818CF8" }}>
                  Ver reportes <ArrowRight size={12} />
                </button>
              </div>
              <div class="space-y-3 max-h-72 overflow-y-auto pr-1">
                {cargando.value ? (
                  <p class="text-xs" style={{ color: "#94A3B8" }}>Cargando...</p>
                ) : clientesFrecuentes.value.length === 0 ? (
                  <p class="text-xs" style={{ color: "#94A3B8" }}>Sin datos en el período</p>
                ) : (
                  clientesFrecuentes.value.slice(0, 4).map((c, i) => (
                    <div key={i} class="flex items-center gap-3">
                      <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0" style={{ background: "#EEF2FF", color: "#818CF8" }}>
                        {c.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-xs font-semibold truncate" style={{ color: "#0F172A" }}>{c.nombre}</p>
                        <p class="text-xs" style={{ color: "#94A3B8" }}>{c.total_facturas} facturas · L. {c.monto_total}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      );
    };
  },
});
</script>
