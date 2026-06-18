<script lang="tsx">
import { defineComponent, ref, type PropType } from 'vue';
import {
  LayoutDashboard, Package, ShoppingCart, Users, BarChart3,
  Building2, Settings, Store, LogOut, Bell,
  Menu, X, AlertTriangle, Trash2,
} from "lucide-vue-next";
import logoUrl from '../assets/turbo-auto-logo.png';

type Page = "panel" | "inventario" | "ventas" | "clientes" | "reportes" | "sucursales" | "configuracion" | "storefront";

const navItems: {
  id: Page;
  label: string;
  icon: any;
  accentColor: string;
  dotColor: string;
}[] = [
  { id: "panel", label: "Panel general", icon: LayoutDashboard, accentColor: "#38BDF8", dotColor: "#38BDF8" },
  { id: "inventario", label: "Inventario", icon: Package, accentColor: "#38BDF8", dotColor: "#38BDF8" },
  { id: "ventas", label: "Facturación", icon: ShoppingCart, accentColor: "#F87171", dotColor: "#F87171" },
  { id: "clientes", label: "Clientes", icon: Users, accentColor: "#FB923C", dotColor: "#FB923C" },
  { id: "reportes", label: "Reportes", icon: BarChart3, accentColor: "#FDBA74", dotColor: "#FDBA74" },
  { id: "sucursales", label: "Sucursales", icon: Building2, accentColor: "#818CF8", dotColor: "#818CF8" },
  { id: "storefront", label: "Tienda pública", icon: Store, accentColor: "#34D399", dotColor: "#34D399" },
  { id: "configuracion", label: "Configuración", icon: Settings, accentColor: "#94A3B8", dotColor: "#94A3B8" },
];


export default defineComponent({
  name: 'Layout',
  props: { currentPage: { type: String, required: true }, usuario: { type: Object as PropType<SesionUsuario | null>, default: null } },
  emits: ["navigate", "logout"],
  setup(props, { emit, slots }) {
  const onNavigate = (page: Page) => emit('navigate', page);
  const onLogout = () => emit('logout');

  const sidebarOpen = ref(false);
  const setSidebarOpen = (next: any) => { sidebarOpen.value = typeof next === 'function' ? next(sidebarOpen.value) : next; };
  const notifOpen = ref(false);
  const setNotifOpen = (next: any) => { notifOpen.value = typeof next === 'function' ? next(notifOpen.value) : next; };
  const alerts = ref([
    { id: 1, text: "Filtro de aceite 5W-30 — stock crítico (Sucursal Central)", type: "danger" },
    { id: 2, text: "Pastillas de freno Bosch — advertencia de nivel bajo", type: "warning" },
    { id: 3, text: "Bujías NGK — sobrestock detectado (Sucursal Norte)", type: "info" },
  ]);
  const setAlerts = (next: any) => { alerts.value = typeof next === 'function' ? next(alerts.value) : next; };

  const eliminarAlerta = (id: number) => {
    if (confirm("¿Estás seguro de eliminar esta alerta?")) {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const getCurrentItem = () => navItems.find((n) => n.id === props.currentPage);
  const HeaderIcon = () => {
    return (
      <div class="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: '#0F172A' }}>
        <img src={logoUrl} alt="Turbo Auto F&M 504" class="w-8 h-8 object-contain" />
      </div>
    );
  };


    return () => {
      const sucursalActiva = props.usuario ? getSucursalActiva(props.usuario.sucursalId) : null;
      return (
    <div class="flex h-screen overflow-hidden" style={{ background: "#F8FAFC" }}>
      {/* Mobile overlay */}
      {sidebarOpen.value && (
        <div
          class="lg:hidden fixed inset-0 z-30 bg-black/60"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        class={`fixed lg:static inset-y-0 left-0 z-40 w-64 flex flex-col transition-transform duration-300 ${
          sidebarOpen.value ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{ background: "#0F172A" }}
      >
        {/* Logo */}
        <div
          class="flex items-center justify-between px-5 py-5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div class="flex items-center gap-3">
            <img src={logoUrl} alt="Turbo Auto F&M 504" class="w-12 h-12 object-contain flex-shrink-0 drop-shadow-xl" />
            <div>
              <div class="text-white font-extrabold text-sm leading-none tracking-wide">
                Turbo Auto
              </div>
              <div
                class="text-xs font-bold tracking-widest mt-0.5"
                style={{ color: "#38BDF8" }}
              >
                F&amp;M 504
              </div>
            </div>
          </div>
          <button
            class="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p
            class="text-xs font-bold px-3 mb-3 uppercase tracking-widest"
            style={{ color: "#334155" }}
          >
            Menú principal
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = props.currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setSidebarOpen(false);
                }}
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left relative overflow-hidden group"
                style={{
                  background: active ? `${item.accentColor}15` : "transparent",
                  color: active ? item.accentColor : "#64748B",
                }}
              >
                {/* active left accent bar */}
                {active && (
                  <div
                    class="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full"
                    style={{ background: item.accentColor }}
                  />
                )}

                {/* color dot */}
                <div
                  class="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all"
                  style={{
                    background: active ? item.dotColor : "rgba(255,255,255,0.12)",
                    boxShadow: active ? `0 0 6px ${item.dotColor}` : "none",
                  }}
                />

                <div
                  class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    background: active ? `${item.accentColor}20` : "transparent",
                  }}
                >
                  <Icon size={15} />
                </div>

                <span class={active ? "font-semibold" : ""}>{item.label}</span>

                {item.id === "inventario" && (
                  <span
                    class="ml-auto text-xs px-1.5 py-0.5 rounded-md font-bold"
                    style={{ background: "#F87171", color: "#fff" }}
                  >
                    3
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div
          class="px-4 py-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div class="flex items-center gap-3 mb-3">
            <div
              class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold shadow"
              style={{
                background: "linear-gradient(135deg,#38BDF8,#818CF8)",
                color: "#fff",
              }}
            >
              AD
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-white text-sm font-semibold truncate">{props.usuario?.nombre ?? 'Usuario'}</div>
              <div class="text-xs truncate" style={{ color: "#475569" }}>
                {props.usuario?.email ?? 'sesion@turboauto.com'}
              </div>
              <div class="text-xs truncate" style={{ color: "#38BDF8" }}>
                {sucursalActiva?.nombre ?? 'Sin sucursal'}
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            class="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all font-semibold"
            style={{ color: "#F87171", background: "rgba(248,113,113,0.09)" }}
          >
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header
          class="flex-shrink-0 flex items-center justify-between px-6 py-3.5"
          style={{
            background: "#fff",
            borderBottom: "1px solid rgba(15,23,42,0.07)",
          }}
        >
          <div class="flex items-center gap-3">
            <button
              class="lg:hidden"
              onClick={() => setSidebarOpen(true)}
              style={{ color: "#64748B" }}
            >
              <Menu size={20} />
            </button>
            <div class="flex items-center gap-3">
              {HeaderIcon()}
              <div>
                <h1 class="font-bold text-base leading-none" style={{ color: "#0F172A" }}>
                  {getCurrentItem()?.label ?? "Panel general"}
                </h1>
                <p class="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
                  {sucursalActiva?.nombre ?? 'Turbo Auto F&M 504'}
                </p>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2.5">
            {/* Notifications */}
            <div class="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen.value)}
                class="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                style={{ background: "#F1F5F9" }}
              >
                <Bell size={16} style={{ color: "#64748B" }} />
                {alerts.value.length > 0 && (
                  <span
                    class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                    style={{ background: "#F87171", boxShadow: "0 0 0 2px #fff" }}
                  />
                )}
              </button>

              {notifOpen.value && (
                <div
                  class="absolute right-0 top-12 w-80 rounded-2xl shadow-2xl z-50 overflow-hidden"
                  style={{ background: "#fff", border: "1px solid rgba(15,23,42,0.08)" }}
                >
                  <div
                    class="px-4 py-3 flex items-center justify-between"
                    style={{ borderBottom: "1px solid #F1F5F9" }}
                  >
                    <span class="font-bold text-sm" style={{ color: "#0F172A" }}>
                      Alertas activas
                    </span>
                    {alerts.value.length > 0 && (
                      <span
                        class="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: "#FEF2F2", color: "#EF4444" }}
                      >
                        {alerts.value.length}
                      </span>
                    )}
                  </div>
                  <div class="divide-y" style={{ borderColor: "#F8FAFC" }}>
                    {alerts.value.map((a) => (
                      <div key={a.id} class="px-4 py-3 flex items-start gap-3">
                        <AlertTriangle
                          size={13}
                          class="mt-0.5 flex-shrink-0"
                          style={{
                            color:
                              a.type === "danger"
                                ? "#F87171"
                                : a.type === "warning"
                                ? "#FB923C"
                                : "#38BDF8",
                          }}
                        />
                        <span class="text-xs flex-1" style={{ color: "#374151" }}>
                          {a.text}
                        </span>
                        <button
                          onClick={() => eliminarAlerta(a.id)}
                          class="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 hover:bg-red-50"
                        >
                          <Trash2 size={11} style={{ color: "#F87171" }} />
                        </button>
                      </div>
                    ))}
                    {alerts.value.length === 0 && (
                      <div class="px-4 py-6 text-center text-xs" style={{ color: "#94A3B8" }}>
                        Sin alertas activas
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Page content */}
        <main class="flex-1 overflow-y-auto p-6">{slots.default?.()}</main>
      </div>
    </div>
  );
    };
  },
});

</script>
