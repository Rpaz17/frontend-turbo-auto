<script lang="tsx">
import { defineComponent } from 'vue';
import { RefreshCw, Home } from 'lucide-vue-next';
import logoUrl from '../assets/turbo-auto-logo.png';

export default defineComponent({
  name: 'InternalErrorScreen',
  props: {
    title: { type: String, default: 'Algo no salió bien' },
    message: {
      type: String,
      default: 'No pudimos cargar esta sección. Intenta nuevamente en unos segundos.',
    },
    actionLabel: { type: String, default: 'Intentar de nuevo' },
    secondaryLabel: { type: String, default: '' },
  },
  emits: ['retry', 'secondary'],
  setup(props, { emit }) {
    return () => (
      <div
        class="min-h-[420px] w-full flex items-center justify-center px-4 py-12"
        style={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #EEF6FF 48%, #FFF7ED 100%)' }}
      >
        <div class="w-full max-w-xl overflow-hidden rounded-3xl shadow-2xl" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.08)' }}>
          <div class="relative px-8 pt-10 pb-8 text-center overflow-hidden" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #172554 58%, #111827 100%)' }}>
            <div class="absolute -right-20 -top-24 w-56 h-56 rounded-full" style={{ background: 'rgba(56,189,248,0.16)' }} />
            <div class="absolute -left-20 bottom-0 w-52 h-52 rounded-full" style={{ background: 'rgba(248,113,113,0.14)' }} />
            <div class="relative mx-auto w-40 h-40 rounded-3xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)' }}>
              <img src={logoUrl} alt="Turbo Auto F&M 504" class="w-32 h-32 object-contain drop-shadow-2xl" />
            </div>
          </div>
          <div class="px-8 py-7 text-center">
            <p class="text-xs font-bold uppercase tracking-[0.22em] mb-3" style={{ color: '#38BDF8' }}>
              Turbo Auto F&amp;M 504
            </p>
            <h1 class="text-2xl font-extrabold mb-3" style={{ color: '#0F172A' }}>
              {props.title}
            </h1>
            <p class="text-sm leading-6 max-w-md mx-auto" style={{ color: '#64748B' }}>
              {props.message}
            </p>
            <div class="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => emit('retry')} class="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all" style={{ background: '#0F172A', color: '#fff' }}>
                <RefreshCw size={15} />
                {props.actionLabel}
              </button>
              {props.secondaryLabel && (
                <button onClick={() => emit('secondary')} class="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all" style={{ background: '#F8FAFC', color: '#334155', border: '1px solid #E2E8F0' }}>
                  <Home size={15} />
                  {props.secondaryLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
});
</script>
