<script lang="tsx">
import { defineComponent, onMounted, computed, type PropType } from 'vue';
import { MessageCircle, Instagram, Facebook, Phone, Star, MapPin, Zap, ArrowLeft, ShoppingBag, Globe, Loader2, AlertCircle } from 'lucide-vue-next';
import { type Product } from '../api/schemas';
import { formatPrecio } from '../composables/useProductos';
import { useInventarioProducto } from '../composables/useInventarioProducto';
import { useResenas } from '../composables/useResenas';
import { useCanales } from '../composables/useCanales';

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

function formatFecha(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('es-HN');
}

export default defineComponent({
  name: 'ProductDetail',
  props: {
    product: {
      type: Object as PropType<Product>,
      required: true,
    },
  },
  emits: ['volver', 'irLogin'],
  setup(props, { emit }) {
    const inv = useInventarioProducto();
    const reviews = useResenas();
    const { canales, load: loadCanales } = useCanales();

    onMounted(() => {
      inv.load(props.product.id);
      reviews.load(props.product.id);
      loadCanales();
    });

    const onVolver = () => emit('volver');
    const onIrLogin = () => emit('irLogin');

    return () => {
      const detalle = props.product;
      const contactos = canales.value;

      return (
        <div class="min-h-screen" style={{ background: '#F8FAFC' }}>
          <header style={{ background: '#0F172A' }} class="sticky top-0 z-40">
            <div class="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#38BDF8' }}>
                  <Zap size={16} style={{ color: '#0F172A' }} />
                </div>
                <div>
                  <div class="text-white font-bold text-sm">Turbo Auto F&M 504</div>
                  <div class="text-xs font-semibold" style={{ color: '#38BDF8' }}>Repuestos automotrices</div>
                </div>
              </div>
              <button onClick={onIrLogin} class="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: 'rgba(255,255,255,0.1)', color: '#E2E8F0' }}>
                Admin →
              </button>
            </div>
          </header>

          <div class="max-w-5xl mx-auto px-6 py-8">
            <button onClick={onVolver} class="flex items-center gap-2 mb-6 text-sm font-semibold" style={{ color: '#38BDF8' }}>
              <ArrowLeft size={15} /> Volver al catálogo
            </button>
            
            <div class="grid lg:grid-cols-2 gap-8">
              <div>
                <div class="rounded-2xl overflow-hidden mb-4 aspect-video flex items-center justify-center" style={{ background: '#F1F5F9' }}>
                  <div class="flex flex-col items-center gap-2" style={{ color: '#CBD5E1' }}>
                    <ShoppingBag size={40} />
                    <span class="text-xs font-semibold">{detalle.codigo}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <span class="text-xs px-2.5 py-1 rounded-full font-semibold mb-3 inline-block" style={{ background: '#F0F9FF', color: '#38BDF8', border: '1px solid #BAE6FD' }}>
                  {detalle.codigo}
                </span>
                <h1 class="text-2xl font-bold mb-2" style={{ color: '#0F172A' }}>{detalle.nombre}</h1>
                <div class="text-3xl font-bold mb-4" style={{ color: '#38BDF8' }}>{formatPrecio(detalle.precio)}</div>

                {/* Disponibilidad por sucursal */}
                <div class="mb-6">
                  <p class="text-xs font-bold mb-2" style={{ color: '#374151' }}>Disponibilidad por sucursal</p>
                  {inv.loading.value ? (
                    <div class="flex items-center gap-2 text-xs" style={{ color: '#94A3B8' }}>
                      <Loader2 size={14} class="animate-spin" /> Consultando inventario…
                    </div>
                  ) : inv.error.value ? (
                    <div class="flex items-center gap-2 text-xs" style={{ color: '#DC2626' }}>
                      <AlertCircle size={14} /> {inv.error.value}
                    </div>
                  ) : inv.sucursales.value.length === 0 ? (
                    <div class="text-xs p-3 rounded-xl" style={{ background: '#F8FAFC', color: '#94A3B8' }}>
                      Sin información de inventario disponible por el momento.
                    </div>
                  ) : (
                    <div class="flex gap-2 flex-wrap">
                      {inv.sucursales.value.map((s) => {
                        const disp = s.cantidad > 0;
                        return (
                          <div key={s.sucursal_id} class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: disp ? '#F0FDF4' : '#FEF2F2', color: disp ? '#16A34A' : '#DC2626', border: `1px solid ${disp ? '#BBF7D0' : '#FECACA'}` }}>
                            <MapPin size={10} /> {s.sucursal_nombre ?? `Sucursal ${s.sucursal_id}`}: {disp ? `${s.cantidad} en stock` : 'Agotado'}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <p class="text-xs font-bold mb-3" style={{ color: '#374151' }}>Consultar disponibilidad / hacer pedido</p>
                <div class="space-y-2">
                  {contactos.map((c) => { 
                    const cfg = getCanalConfig(c); 
                    const Icon = cfg.icon; 
                    return (
                      <a key={c.id} href={c.url || '#'} target="_blank" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:scale-[1.01]" style={{ background: cfg.bg, border: `1px solid ${cfg.color}25` }}>
                        <Icon size={18} style={{ color: cfg.color }} />
                        <div class="text-left">
                          <div class="text-xs font-bold" style={{ color: '#374151' }}>Contactar por {cfg.label}</div>
                          <div class="text-[10px]" style={{ color: '#94A3B8' }}>{c.name || 'Enlace directo'}</div>
                        </div>
                      </a>

                    ); 
                  })}
                  {contactos.length === 0 && <div class="text-xs p-3 rounded-xl" style={{ background: '#F8FAFC', color: '#94A3B8' }}>Sin canales activos por el momento.</div>}
                </div>
                {reviews.promedio.value > 0 && (
                  <div class="flex items-center gap-2 mt-5">
                    <Star size={16} style={{ color: '#FDBA74', fill: '#FDBA74' }} />
                    <span class="text-sm font-semibold" style={{ color: '#64748B' }}>
                      {reviews.promedio.value.toFixed(1)} · {reviews.resenas.value.length} reseñas
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Reseñas */}
            <div class="mt-8 rounded-2xl p-6 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.06)' }}>
              <h3 class="font-bold mb-4" style={{ color: '#0F172A' }}>Reseñas de clientes</h3>
              {reviews.loading.value ? (
                <div class="flex items-center gap-2 text-xs" style={{ color: '#94A3B8' }}>
                  <Loader2 size={14} class="animate-spin" /> Cargando reseñas…
                </div>
              ) : reviews.resenas.value.length === 0 ? (
                <p class="text-xs" style={{ color: '#94A3B8' }}>Este producto aún no tiene reseñas.</p>
              ) : (
                <div class="space-y-3">
                  {reviews.resenas.value.map((r) => (
                    <div key={r.id} class="rounded-xl p-3" style={{ background: '#F8FAFC' }}>
                      <div class="flex items-center justify-between mb-1">
                        <span class="text-xs font-bold" style={{ color: '#374151' }}>{r.correo}</span>
                        <span class="text-xs" style={{ color: '#94A3B8' }}>{formatFecha(r.created_at)}</span>
                      </div>
                      <div class="flex mb-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={12} style={{ color: s <= r.valor ? '#FDBA74' : '#CBD5E1', fill: s <= r.valor ? '#FDBA74' : 'none' }} />
                        ))}
                      </div>
                      <p class="text-xs" style={{ color: '#64748B' }}>{r.cuerpo}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    };
  },
});
</script>
