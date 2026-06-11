<script lang="tsx">
import { defineComponent, ref } from 'vue';
import { Search, MessageCircle, Instagram, Facebook, Phone, Star, MapPin, Zap, ArrowLeft, ShoppingBag, Globe } from 'lucide-vue-next';
import { categoriasProducto, getProductosCatalogo, store, type Canal } from '../store';

const iconosPorTipo: Record<string, { icon: any; color: string; bg: string }> = {
  WhatsApp: { icon: MessageCircle, color: '#25D366', bg: '#F0FDF4' },
  Instagram: { icon: Instagram, color: '#E1306C', bg: '#FDF2F8' },
  Facebook: { icon: Facebook, color: '#1877F2', bg: '#EFF6FF' },
  Teléfono: { icon: Phone, color: '#38BDF8', bg: '#F0F9FF' },
  'Sitio web': { icon: Globe, color: '#7C3AED', bg: '#F5F3FF' },
};

function getCanalConfig(canal: Canal) {
  return iconosPorTipo[canal.tipo] ?? { icon: Globe, color: '#64748B', bg: '#F8FAFC' };
}

export default defineComponent({
  name: 'Storefront',
  emits: ['irLogin'],
  setup(_, { emit }) {
    const busqueda = ref('');
    const categoria = ref('Todos');
    const productoDetalleId = ref<string | null>(null);
    const nuevaReseña = ref({ calificacion: 5, comentario: '' });
    const onIrLogin = () => emit('irLogin');

    const promedioEstrellas = (reseñas: { calificacion: number }[]) => {
      if (!reseñas.length) return 0;
      return reseñas.reduce((a, r) => a + r.calificacion, 0) / reseñas.length;
    };

    const publicarReseña = (productoId: string) => {
      const producto = store.productos.find((p) => p.id === productoId);
      if (!producto || !nuevaReseña.value.comentario.trim()) return;
      producto.reseñas = producto.reseñas ?? [];
      producto.reseñas.push({ nombre: 'Cliente anónimo', calificacion: nuevaReseña.value.calificacion, comentario: nuevaReseña.value.comentario, fecha: new Date().toLocaleDateString('es-HN') });
      nuevaReseña.value = { calificacion: 5, comentario: '' };
    };

    return () => {
      const productos = getProductosCatalogo();
      const categorias = ['Todos', ...categoriasProducto.slice(1).filter((c) => productos.some((p) => p.tipo === c))];
      const contactos = store.canales.filter((c) => c.activo);
      const filtrados = productos.filter((p) => {
        const text = `${p.nombre} ${p.tipo} ${p.proveedor}`.toLowerCase();
        const matchBusq = text.includes(busqueda.value.toLowerCase());
        const matchCat = categoria.value === 'Todos' || p.tipo === categoria.value;
        return matchBusq && matchCat;
      });
      const productoDetalle = productoDetalleId.value ? productos.find((p) => p.id === productoDetalleId.value) : null;

      if (productoDetalle) {
        const prom = promedioEstrellas(productoDetalle.reseñas ?? []);
        return (
          <div class="min-h-screen" style={{ background: '#F8FAFC' }}>
            <header style={{ background: '#0F172A' }} class="sticky top-0 z-40">
              <div class="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                <div class="flex items-center gap-3"><div class="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#38BDF8' }}><Zap size={16} style={{ color: '#0F172A' }} /></div><div><div class="text-white font-bold text-sm">Turbo Auto F&M 504</div><div class="text-xs font-semibold" style={{ color: '#38BDF8' }}>Repuestos automotrices</div></div></div>
                <button onClick={onIrLogin} class="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: 'rgba(255,255,255,0.1)', color: '#E2E8F0' }}>Admin →</button>
              </div>
            </header>

            <div class="max-w-5xl mx-auto px-6 py-8">
              <button onClick={() => (productoDetalleId.value = null)} class="flex items-center gap-2 mb-6 text-sm font-semibold" style={{ color: '#38BDF8' }}><ArrowLeft size={15} /> Volver al catálogo</button>
              <div class="grid lg:grid-cols-2 gap-8">
                <div><div class="rounded-2xl overflow-hidden mb-4 aspect-video flex items-center justify-center" style={{ background: '#F1F5F9' }}><div class="flex flex-col items-center gap-2" style={{ color: '#CBD5E1' }}><ShoppingBag size={40} /><span class="text-xs font-semibold">{productoDetalle.tipo}</span></div></div></div>
                <div>
                  <span class="text-xs px-2.5 py-1 rounded-full font-semibold mb-3 inline-block" style={{ background: '#F0F9FF', color: '#38BDF8', border: '1px solid #BAE6FD' }}>{productoDetalle.tipo}</span>
                  <h1 class="text-2xl font-bold mb-2" style={{ color: '#0F172A' }}>{productoDetalle.nombre}</h1>
                  <div class="text-3xl font-bold mb-4" style={{ color: '#38BDF8' }}>{productoDetalle.precio}</div>
                  <p class="text-sm leading-relaxed mb-6" style={{ color: '#64748B' }}>{productoDetalle.descripcion}</p>
                  <div class="mb-6"><p class="text-xs font-bold mb-2" style={{ color: '#374151' }}>Disponibilidad por sucursal</p><div class="flex gap-2 flex-wrap">{Object.entries(productoDetalle.disponibilidad).map(([suc, disp]) => <div key={suc} class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: disp ? '#F0FDF4' : '#FEF2F2', color: disp ? '#16A34A' : '#DC2626', border: `1px solid ${disp ? '#BBF7D0' : '#FECACA'}` }}><MapPin size={10} /> {suc}: {disp ? 'Disponible' : 'Agotado'}</div>)}</div></div>
                  <p class="text-xs font-bold mb-3" style={{ color: '#374151' }}>Consultar disponibilidad / hacer pedido</p>
                  <div class="space-y-2">
                    {contactos.map((c) => { const cfg = getCanalConfig(c); const Icon = cfg.icon; return <a key={c.id} href={c.url || '#'} target="_blank" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:scale-[1.01]" style={{ background: cfg.bg, border: `1px solid ${cfg.color}25` }}><Icon size={18} style={{ color: cfg.color }} /><div class="text-left"><div class="text-xs font-bold" style={{ color: '#374151' }}>Contactar por {c.tipo}</div><div class="text-xs" style={{ color: '#94A3B8' }}>{c.identificador}</div></div></a>; })}
                    {contactos.length === 0 && <div class="text-xs p-3 rounded-xl" style={{ background: '#F8FAFC', color: '#94A3B8' }}>Sin canales activos por el momento.</div>}
                  </div>
                  {prom > 0 && <div class="flex items-center gap-2 mt-5"><Star size={16} style={{ color: '#FDBA74', fill: '#FDBA74' }} /><span class="text-sm font-semibold" style={{ color: '#64748B' }}>{prom.toFixed(1)} · {productoDetalle.reseñas.length} reseñas</span></div>}
                </div>
              </div>

              <div class="mt-8 rounded-2xl p-6 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.06)' }}>
                <h3 class="font-bold mb-4" style={{ color: '#0F172A' }}>Reseñas de clientes</h3>
                <div class="space-y-3 mb-5">{(productoDetalle.reseñas ?? []).map((r, idx) => <div key={idx} class="rounded-xl p-3" style={{ background: '#F8FAFC' }}><div class="flex items-center justify-between mb-1"><span class="text-xs font-bold" style={{ color: '#374151' }}>{r.nombre}</span><span class="text-xs" style={{ color: '#94A3B8' }}>{r.fecha}</span></div><div class="flex mb-1">{[1,2,3,4,5].map((s) => <Star key={s} size={12} style={{ color: s <= r.calificacion ? '#FDBA74' : '#CBD5E1', fill: s <= r.calificacion ? '#FDBA74' : 'none' }} />)}</div><p class="text-xs" style={{ color: '#64748B' }}>{r.comentario}</p></div>)}</div>
                <div class="rounded-xl p-4" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}><p class="text-xs font-semibold mb-2" style={{ color: '#374151' }}>Agregar reseña</p><div class="flex gap-1 mb-3">{[1,2,3,4,5].map((s) => <button key={s} onClick={() => (nuevaReseña.value = { ...nuevaReseña.value, calificacion: s })}><Star size={22} style={{ color: s <= nuevaReseña.value.calificacion ? '#FDBA74' : '#E2E8F0', fill: s <= nuevaReseña.value.calificacion ? '#FDBA74' : 'none', transition: 'all 0.15s' }} /></button>)}</div><textarea value={nuevaReseña.value.comentario} onChange={(e) => (nuevaReseña.value = { ...nuevaReseña.value, comentario: (e.target as HTMLTextAreaElement).value })} placeholder="Comparte tu experiencia con este producto..." rows={3} class="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none mb-3" style={{ background: '#fff', border: '1px solid #E2E8F0', color: '#111827' }} /><button onClick={() => publicarReseña(productoDetalle.id)} class="px-5 py-2.5 rounded-xl text-sm font-semibold" style={{ background: '#0F172A', color: '#fff' }}>Publicar reseña</button></div>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div class="min-h-screen" style={{ background: '#F8FAFC' }}>
          <header style={{ background: '#0F172A' }} class="sticky top-0 z-40"><div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between"><div class="flex items-center gap-3"><div class="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#38BDF8' }}><Zap size={16} style={{ color: '#0F172A' }} /></div><div><div class="text-white font-bold">Turbo Auto F&M 504</div><div class="text-xs font-semibold" style={{ color: '#38BDF8' }}>Repuestos automotrices</div></div></div><div class="hidden md:flex items-center gap-4">{contactos.slice(0, 3).map((c) => { const cfg = getCanalConfig(c); const Icon = cfg.icon; return <a key={c.id} href={c.url || '#'} target="_blank" class="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)', color: '#E2E8F0' }}><Icon size={13} style={{ color: cfg.color }} /> {c.tipo}</a>; })}</div><button onClick={onIrLogin} class="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: 'rgba(255,255,255,0.1)', color: '#E2E8F0' }}>Admin →</button></div></header>
          <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }} class="py-12"><div class="max-w-6xl mx-auto px-6 text-center"><h1 class="text-3xl font-bold text-white mb-2">Catálogo de repuestos</h1><p class="mb-6" style={{ color: '#94A3B8' }}>Encuentra el repuesto que necesitas con disponibilidad en tiempo real</p><div class="relative max-w-md mx-auto"><Search size={16} class="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} /><input value={busqueda.value} onChange={(e) => (busqueda.value = (e.target as HTMLInputElement).value)} placeholder="Buscar repuestos, marcas, categorías..." class="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm outline-none" style={{ background: 'rgba(255,255,255,0.95)', color: '#111827' }} /></div></div></div>
          <div class="max-w-6xl mx-auto px-6 py-6"><div class="flex gap-2 flex-wrap">{categorias.map((c) => <button key={c} onClick={() => (categoria.value = c)} class="px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={{ background: categoria.value === c ? '#0F172A' : '#fff', color: categoria.value === c ? '#fff' : '#64748B', border: categoria.value === c ? 'none' : '1px solid #E2E8F0' }}>{c}</button>)}</div></div>
          <div class="max-w-6xl mx-auto px-6 pb-12"><p class="text-sm mb-5" style={{ color: '#94A3B8' }}>{filtrados.length} productos encontrados</p><div class="grid grid-cols-2 lg:grid-cols-3 gap-5">{filtrados.map((p) => { const prom = promedioEstrellas(p.reseñas ?? []); const hayStock = Object.values(p.disponibilidad).some(Boolean); return <div key={p.id} onClick={() => (productoDetalleId.value = p.id)} class="rounded-2xl overflow-hidden shadow-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.06)' }}><div class="aspect-video relative flex items-center justify-center" style={{ background: '#F1F5F9' }}><div class="flex flex-col items-center gap-1.5" style={{ color: '#CBD5E1' }}><ShoppingBag size={32} /><span class="text-xs font-semibold">{p.tipo}</span></div><div class="absolute top-2 right-2"><span class="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: hayStock ? 'rgba(134,239,172,0.9)' : 'rgba(248,113,113,0.9)', color: hayStock ? '#14532D' : '#7F1D1D' }}>{hayStock ? 'Disponible' : 'Agotado'}</span></div></div><div class="p-4"><span class="text-xs font-semibold px-2 py-0.5 rounded-md mb-2 inline-block" style={{ background: '#F0F9FF', color: '#38BDF8' }}>{p.tipo}</span><h3 class="font-bold text-sm mb-2 leading-tight" style={{ color: '#0F172A' }}>{p.nombre}</h3><div class="flex items-center justify-between"><span class="font-bold" style={{ color: '#38BDF8' }}>{p.precio}</span>{prom > 0 && <div class="flex items-center gap-1"><Star size={12} style={{ color: '#FDBA74', fill: '#FDBA74' }} /><span class="text-xs font-semibold" style={{ color: '#64748B' }}>{prom.toFixed(1)}</span></div>}</div><div class="flex gap-1.5 mt-3 flex-wrap">{Object.entries(p.disponibilidad).map(([suc, disp]) => <span key={suc} class="text-xs px-1.5 py-0.5 rounded-md font-semibold" style={{ background: disp ? '#F0FDF4' : '#FEF2F2', color: disp ? '#16A34A' : '#DC2626' }}>{suc}</span>)}</div></div></div>; })}</div></div>
          <footer style={{ background: '#0F172A' }} class="py-8"><div class="max-w-6xl mx-auto px-6"><div class="flex flex-wrap items-center justify-between gap-6"><div><div class="text-white font-bold mb-1">Turbo Auto F&M 504</div><p class="text-xs" style={{ color: '#64748B' }}>Repuestos automotrices de calidad en Honduras</p></div><div><p class="text-xs font-semibold mb-3" style={{ color: '#94A3B8' }}>Contáctanos</p><div class="flex gap-2 flex-wrap">{contactos.map((c) => { const cfg = getCanalConfig(c); const Icon = cfg.icon; return <a key={c.id} href={c.url || '#'} target="_blank" class="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold" style={{ background: cfg.bg, color: '#374151' }}><Icon size={14} style={{ color: cfg.color }} /> {c.tipo}</a>; })}</div></div></div><div class="mt-6 pt-6 text-center text-xs" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: '#475569' }}>© 2024 Turbo Auto F&M 504. Todos los derechos reservados.</div></div></footer>
        </div>
      );
    };
  },
});
</script>
