<script lang="tsx">
import { defineComponent, onErrorCaptured, onMounted, ref } from 'vue';
import { AlertTriangle, X } from 'lucide-vue-next';
import InternalErrorScreen from './components/InternalErrorScreen.vue';
import { useStockNotifications } from './composables/useStockNotifications';

export default defineComponent({
  name: 'App',
  setup() {
    const appError = ref<Error | null>(null);
    const { latest, start } = useStockNotifications();

    onMounted(() => {
      start();
    });

    onErrorCaptured((err) => {
      appError.value = err instanceof Error ? err : new Error(String(err));
      console.error('Error interno de la aplicación:', err);
      return false;
    });

    return () => {
      if (appError.value) {
        return (
          <InternalErrorScreen
            title="Error interno"
            message="Ocurrió un problema inesperado en el panel. Puedes intentar recargar la vista."
            actionLabel="Recargar vista"
            secondaryLabel="Ir al inicio"
            onRetry={() => (appError.value = null)}
            onSecondary={() => {
              appError.value = null;
              window.location.href = '/';
            }}
          />
        );
      }
      return (
        <>
          <router-view />
          {latest.value && (
            <div class="fixed right-5 top-5 z-50 w-[min(360px,calc(100vw-2.5rem))] rounded-2xl shadow-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid #FECACA" }}>
              <div class="p-4 flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#FEE2E2" }}>
                  <AlertTriangle size={20} style={{ color: "#DC2626" }} />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-sm font-extrabold" style={{ color: "#0F172A" }}>Producto agotado</div>
                  <div class="text-xs mt-1 leading-relaxed" style={{ color: "#64748B" }}>
                    {latest.value.producto_nombre} quedó sin stock en {latest.value.sucursal_nombre ?? `Sucursal ${latest.value.sucursal_id}`}.
                  </div>
                  <div class="text-[11px] mt-2 font-semibold" style={{ color: "#94A3B8" }}>
                    Factura {latest.value.numero_factura}
                  </div>
                </div>
                <button onClick={() => (latest.value = null)} class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#F8FAFC" }}>
                  <X size={14} style={{ color: "#64748B" }} />
                </button>
              </div>
            </div>
          )}
        </>
      );
    };
  },
});
</script>
