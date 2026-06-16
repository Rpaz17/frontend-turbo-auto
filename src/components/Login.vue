<script lang="tsx">
import { defineComponent, ref } from 'vue';
import { Lock, User, AlertCircle, Zap, ArrowLeft } from "lucide-vue-next";
import { useAuth } from "../composables/useAuth";


export default defineComponent({
  name: 'Login',

  emits: ["login", "volver"],
  setup(props, { emit }) {
  const onLogin = () => emit('login');
  const onVolver = () => emit('volver');

  // La API de auth usa usuario + contraseña (no correo).
  const { login, loading, error } = useAuth();
  const username = ref("");
  const setUsername = (next: any) => { username.value = typeof next === 'function' ? next(username.value) : next; };
  const password = ref("");
  const setPassword = (next: any) => { password.value = typeof next === 'function' ? next(password.value) : next; };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const ok = await login({ username: username.value, password: password.value });
    if (ok) onLogin();
  };

    return () => {
      return (
    <div class="min-h-screen flex" style={{ background: "linear-gradient(135deg, #0F172A 0%, #111827 60%, #1E293B 100%)" }}>
      {/* Left panel */}
      <div class="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden">
        <div class="absolute inset-0 opacity-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} class="absolute border border-white rounded-full"
              style={{ width: `${(i + 1) * 120}px`, height: `${(i + 1) * 120}px`, top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
          ))}
        </div>
        <div class="relative z-10">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#38BDF8" }}>
              <Zap size={22} class="text-white" style={{ color: "#0F172A" }} />
            </div>
            <div>
              <div class="text-white font-bold text-xl leading-none">Turbo Auto</div>
              <div class="text-xs font-semibold tracking-widest" style={{ color: "#38BDF8" }}>F&M 504</div>
            </div>
          </div>
        </div>
        <div class="relative z-10 space-y-6">
          <h2 class="text-white text-4xl font-bold leading-tight">
            Sistema de gestión<br />
            <span style={{ color: "#38BDF8" }}>automotriz</span><br />
            integral
          </h2>
          <p class="text-slate-400 text-sm leading-relaxed max-w-sm">
            Administra tu inventario, facturación, clientes y sucursales desde un solo lugar. Diseñado para negocios de repuestos.
          </p>
          <div class="flex gap-4">
            {[
              { label: "Sucursales", value: "3" },
              { label: "Productos", value: "2,400+" },
              { label: "Clientes", value: "850+" },
            ].map((stat) => (
              <div key={stat.label} class="rounded-xl p-4 flex-1" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div class="text-2xl font-bold text-white">{stat.value}</div>
                <div class="text-xs text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div class="relative z-10 text-slate-500 text-xs">
          © 2024 Turbo Auto F&M 504. Todos los derechos reservados.
        </div>
      </div>

      {/* Right panel - login form */}
      <div class="flex-1 flex items-center justify-center p-8">
        <div class="w-full max-w-sm">
          <div class="rounded-2xl p-8 shadow-2xl" style={{ background: "rgba(255,255,255,0.97)" }}>
            {/* Logo mobile */}
            <div class="lg:hidden flex items-center gap-3 mb-8 justify-center">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#38BDF8" }}>
                <Zap size={22} style={{ color: "#0F172A" }} />
              </div>
              <div>
                <div class="font-bold text-xl" style={{ color: "#0F172A" }}>Turbo Auto</div>
                <div class="text-xs font-semibold tracking-widest" style={{ color: "#38BDF8" }}>F&M 504</div>
              </div>
            </div>

            <button
              onClick={onVolver}
              class="flex items-center gap-2 mb-6 text-sm font-semibold transition-all hover:gap-3"
              style={{ color: "#38BDF8" }}
            >
              <ArrowLeft size={16} /> Volver a la tienda
            </button>

            <div class="mb-8">
              <h1 class="text-2xl font-bold mb-1" style={{ color: "#0F172A" }}>Iniciar sesión</h1>
              <p class="text-sm" style={{ color: "#64748B" }}>Accede al panel administrativo</p>
            </div>

            <form onSubmit={handleSubmit} class="space-y-5">
              <div>
                <label class="block text-sm font-semibold mb-2" style={{ color: "#374151" }}>
                  Usuario
                </label>
                <div class="relative">
                  <User size={16} class="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#94A3B8" }} />
                  <input
                    type="text"
                    value={username.value}
                    onInput={(e) => setUsername((e.target as HTMLInputElement).value)}
                    placeholder="admin"
                    class="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: "#F8FAFC",
                      border: error.value ? "2px solid #F87171" : "2px solid #E2E8F0",
                      color: "#111827",
                    }}
                  />
                </div>
              </div>

              <div>
                <label class="block text-sm font-semibold mb-2" style={{ color: "#374151" }}>
                  Contraseña
                </label>
                <div class="relative">
                  <Lock size={16} class="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#94A3B8" }} />
                  <input
                    type="password"
                    value={password.value}
                    onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
                    placeholder="••••••••"
                    class="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: "#F8FAFC",
                      border: error.value ? "2px solid #F87171" : "2px solid #E2E8F0",
                      color: "#111827",
                    }}
                  />
                </div>
              </div>

              {error.value && (
                <div class="flex items-center gap-2 p-3 rounded-xl" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
                  <AlertCircle size={16} style={{ color: "#F87171" }} />
                  <span class="text-sm font-medium" style={{ color: "#DC2626" }}>
                    {error.value}
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading.value}
                class="w-full py-3 rounded-xl font-semibold text-sm transition-all"
                style={{
                  background: loading.value ? "#94A3B8" : "#0F172A",
                  color: "#ffffff",
                  cursor: loading.value ? "not-allowed" : "pointer",
                }}
              >
                {loading.value ? "Verificando..." : "Ingresar"}
              </button>
            </form>

            <p class="text-center text-xs mt-6" style={{ color: "#94A3B8" }}>
              Ingresa con tu usuario y contraseña del sistema.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
    };
  },
});

</script>
