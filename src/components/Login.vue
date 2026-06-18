<script lang="tsx">
import { defineComponent, ref } from 'vue';
import { Lock, User, AlertCircle, ArrowLeft } from "lucide-vue-next";
import { useAuth } from "../composables/useAuth";
import logoUrl from '../assets/turbo-auto-logo.png';


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
    <div class="min-h-screen lg:grid lg:grid-cols-2" style={{ background: "#F8FAFC" }}>
      {/* Brand panel */}
      <div
        class="hidden lg:flex items-center justify-center p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #082F49 0%, #0F4C81 48%, #0B1324 100%)" }}
      >
        <div class="absolute inset-0" style={{ background: "radial-gradient(circle at center, rgba(56,189,248,0.22) 0%, rgba(56,189,248,0.08) 32%, transparent 62%)" }} />
        <div class="absolute w-[520px] h-[520px] rounded-full blur-3xl opacity-70" style={{ background: "radial-gradient(circle, rgba(248,113,113,0.42) 0%, rgba(239,68,68,0.20) 38%, transparent 70%)" }} />
        <div class="relative w-full max-w-md aspect-square flex items-center justify-center">
          <div class="absolute w-80 h-80 rounded-full blur-2xl" style={{ background: "rgba(248,113,113,0.22)" }} />
          <img src={logoUrl} alt="Turbo Auto F&M 504" class="relative w-full max-w-sm h-auto object-contain drop-shadow-2xl" />
        </div>
      </div>

      {/* Right panel - login form */}
      <div class="min-h-screen lg:min-h-0 flex items-center justify-center p-6 sm:p-8" style={{ background: "#F8FAFC" }}>
        <div class="w-full max-w-sm">
          <div class="rounded-2xl p-8 shadow-xl" style={{ background: "#fff", border: "1px solid #E2E8F0" }}>
            {/* Logo mobile */}
            <div class="lg:hidden flex mb-8 justify-center">
              <img src={logoUrl} alt="Turbo Auto F&M 504" class="w-36 h-auto object-contain" />
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
