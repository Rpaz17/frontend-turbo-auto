<script lang="tsx">
import { defineComponent, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { hasToken } from '../api';
import { Search, MessageCircle, Instagram, Facebook, Phone, Star, MapPin, ShoppingBag, Globe, Loader2 } from 'lucide-vue-next';
import { useProductos, formatPrecio } from '../composables/useProductos';
import { useSucursales } from '../composables/useSucursales';
import { useCanales } from '../composables/useCanales';
import ProductDetail from './ProductDetail.vue';
import InternalErrorScreen from './InternalErrorScreen.vue';
import logoUrl from '../assets/turbo-auto-logo.png';

const iconosPorTipo: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  WhatsApp: { icon: MessageCircle, color: '#25D366', bg: '#F0FDF4', label: 'WhatsApp' },
  Instagram: { icon: Instagram, color: '#E1306C', bg: '#FDF2F8', label: 'Instagram' },
  Facebook: { icon: Facebook, color: '#1877F2', bg: '#EFF6FF', label: 'Facebook' },
  Twitter: { icon: Globe, color: '#1DA1F2', bg: '#E8F5FD', label: 'Twitter' },
  Teléfono: { icon: Phone, color: '#38BDF8', bg: '#F0F9FF', label: 'Teléfono' },
  Default: { icon: Globe, color: '#64748B', bg: '#F8FAFC', label: 'Enlace directo' },
};

function getCanalConfig(canal: any) {
  const url = (canal.url || '').toLowerCase();
  const name = (canal.name || '').toLowerCase();

  if (url.includes('wa.me') || url.includes('whatsapp.com') || name.includes('whatsapp')) return iconosPorTipo.WhatsApp;
  if (url.includes('instagram.com') || name.includes('instagram')) return iconosPorTipo.Instagram;
  if (url.includes('facebook.com') || name.includes('facebook')) return iconosPorTipo.Facebook;
  if (url.includes('twitter.com') || url.includes('x.com') || name.includes('twitter')) return iconosPorTipo.Twitter;
  if (url.includes('tel:') || name.includes('teléfono') || name.includes('telefono')) return iconosPorTipo.Teléfono;

  return iconosPorTipo.Default;
}

export default defineComponent({
  name: 'Storefront',
  setup() {
    const router = useRouter();

    // Catálogo desde la API (GET /products).
    const { productos, loading, error } = useProductos();
    // Carga de sucursales públicas.
    const { sucursales, load: loadSucursales } = useSucursales();
    // Carga de canales de comunicación reales.
    const { canales, load: loadCanales } = useCanales();

    loadSucursales();
    loadCanales();

    const busqueda = ref('');
    const productoDetalleId = ref<string | null>(null);

    const filtrados = computed(() => {
      const q = busqueda.value.toLowerCase();
      return productos.value.filter((p) => `${p.nombre} ${p.codigo}`.toLowerCase().includes(q));
    });

    const productoDetalle = computed(() =>
      productoDetalleId.value ? productos.value.find((p) => p.id === productoDetalleId.value) ?? null : null,
    );

    function abrirDetalle(id: string) {
      productoDetalleId.value = id;
    }

    function cerrarDetalle() {
      productoDetalleId.value = null;
    }

    return () => {
      const contactos = canales.value;

      // ── Vista de detalle del producto (Ahora en componente separado) ─────────
      const detalle = productoDetalle.value;
      if (detalle) {
        return (
          <ProductDetail 
            product={detalle} 
            onVolver={cerrarDetalle} 
          />
        );
      }

      // ── Catálogo ─────────────────────────────────────────────────────────────
      return (
        <div class="min-h-screen" style={{ background: '#F8FAFC' }}>
          <header style={{ background: '#0F172A' }} class="sticky top-0 z-40">
            <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <img src={logoUrl} alt="Turbo Auto F&M 504" class="w-10 h-10 object-contain" />
                <div>
                  <div class="text-white font-bold">Turbo Auto F&M 504</div>
                  <div class="text-xs font-semibold" style={{ color: '#38BDF8' }}>Repuestos automotrices</div>
                </div>
              </div>
              <div class="hidden md:flex items-center gap-4">
                {contactos.slice(0, 3).map((c) => { 
                  const cfg = getCanalConfig(c); 
                  const Icon = cfg.icon; 
                  return (
                    <a key={c.id} href={c.url || '#'} target="_blank" class="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)', color: '#E2E8F0' }}>
                      <Icon size={13} style={{ color: cfg.color }} /> {cfg.label}
                    </a>
                  ); 
                })}
              </div>
              <button onClick={() => router.push(hasToken() ? '/panel' : '/login')} class="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: 'rgba(255,255,255,0.1)', color: '#E2E8F0' }}>
                Admin →
              </button>
            </div>
          </header>

          <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }} class="py-12">
            <div class="max-w-6xl mx-auto px-6 text-center">
              <h1 class="text-3xl font-bold text-white mb-2">Catálogo de repuestos</h1>
              <p class="mb-6" style={{ color: '#94A3B8' }}>Encuentra el repuesto que necesitas con disponibilidad en tiempo real</p>
              <div class="relative max-w-md mx-auto">
                <Search size={16} class="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
                <input 
                  value={busqueda.value} 
                  onInput={(e) => (busqueda.value = (e.target as HTMLInputElement).value)} 
                  placeholder="Buscar repuestos, código..." 
                  class="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm outline-none" 
                  style={{ background: 'rgba(255,255,255,0.95)', color: '#111827' }} 
                />
              </div>
            </div>
          </div>

          <div class="max-w-6xl mx-auto px-6 py-8">
            {loading.value ? (
              <div class="flex items-center justify-center gap-2 py-16 text-sm" style={{ color: '#94A3B8' }}>
                <Loader2 size={18} class="animate-spin" /> Cargando productos…
              </div>
            ) : error.value ? (
              <InternalErrorScreen
                title="No pudimos cargar el catálogo"
                message={error.value}
                actionLabel="Reintentar"
                onRetry={() => window.location.reload()}
              />
            ) : (
              <>
                <p class="text-sm mb-5" style={{ color: '#94A3B8' }}>{filtrados.value.length} productos encontrados</p>
                <div class="grid grid-cols-2 lg:grid-cols-3 gap-5">
                  {filtrados.value.map((p) => (
                    <div key={p.id} onClick={() => abrirDetalle(p.id)} class="rounded-2xl overflow-hidden shadow-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.06)' }}>
                      <div class="aspect-video relative flex items-center justify-center" style={{ background: '#F1F5F9' }}>
                        <div class="flex flex-col items-center gap-1.5" style={{ color: '#CBD5E1' }}>
                          <ShoppingBag size={32} />
                          <span class="text-xs font-semibold">{p.codigo}</span>
                        </div>
                      </div>
                      <div class="p-4">
                        <span class="text-xs font-semibold px-2 py-0.5 rounded-md mb-2 inline-block" style={{ background: '#F0F9FF', color: '#38BDF8' }}>{p.codigo}</span>
                        <h3 class="font-bold text-sm mb-2 leading-tight" style={{ color: '#0F172A' }}>{p.nombre}</h3>
                        <div class="flex items-center justify-between">
                          <span class="font-bold" style={{ color: '#38BDF8' }}>{formatPrecio(p.precio)}</span>
                          <span class="text-xs font-semibold" style={{ color: '#38BDF8' }}>Ver detalle →</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {filtrados.value.length === 0 && <div class="text-center py-12 text-sm" style={{ color: '#94A3B8' }}>No se encontraron productos.</div>}
              </>
            )}
          </div>

          <footer style={{ background: '#0F172A' }} class="py-8">
            <div class="max-w-6xl mx-auto px-6">
              <div class="grid md:grid-cols-3 gap-8 mb-8 text-left">
                <div>
                  <div class="text-white font-bold mb-2">Turbo Auto F&M 504</div>
                  <p class="text-xs" style={{ color: '#64748B' }}>Repuestos automotrices de calidad en Honduras. Comprometidos con la excelencia y el servicio al cliente.</p>
                </div>
                <div>
                  <p class="text-xs font-semibold mb-4" style={{ color: '#94A3B8' }}>Nuestras Sucursales</p>
                  <div class="space-y-3">
                    {sucursales.value.map((s) => (
                      <div key={s.id} class="flex items-start gap-2">
                        <MapPin size={14} class="mt-0.5" style={{ color: '#38BDF8' }} />
                        <div>
                          <div class="text-xs font-bold text-white">{s.nombre}</div>
                          <div class="text-[10px]" style={{ color: '#64748B' }}>{s.direccion}</div>
                        </div>
                      </div>
                    ))}
                    {sucursales.value.length === 0 && <p class="text-xs" style={{ color: '#475569' }}>Cargando sucursales...</p>}
                  </div>
                </div>
                <div>
                  <p class="text-xs font-semibold mb-4" style={{ color: '#94A3B8' }}>Contáctanos</p>
                  <div class="flex gap-2 flex-wrap">
                    {contactos.map((c) => { 
                      const cfg = getCanalConfig(c); 
                      const Icon = cfg.icon; 
                      return (
                        <a key={c.id} href={c.url || '#'} target="_blank" class="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold" style={{ background: cfg.bg, color: '#374151' }}>
                          <Icon size={14} style={{ color: cfg.color }} /> {cfg.label}
                        </a>
                      ); 
                    })}
                  </div>
                </div>
              </div>
              <div class="pt-6 text-center text-xs" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: '#475569' }}>
                Turbo Auto F&M 504. Todos los derechos reservados.
              </div>
            </div>
          </footer>
        </div>
      );
    };
  },
});
</script>
