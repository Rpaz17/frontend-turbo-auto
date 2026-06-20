<script lang="tsx">
import { defineComponent, onErrorCaptured, ref } from 'vue';
import InternalErrorScreen from './components/InternalErrorScreen.vue';

export default defineComponent({
  name: 'App',
  setup() {
    const appError = ref<Error | null>(null);

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
      return <router-view />;
    };
  },
});
</script>
