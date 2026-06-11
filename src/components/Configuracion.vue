<script lang="tsx">
import { defineComponent, ref } from 'vue';
import { MessageCircle, Instagram, Facebook, Phone, Globe, Plus, Trash2, Eye, Save, ToggleLeft, ToggleRight, ShieldCheck, Building2, FileText, Lock, LockOpen, X, AlertCircle } from 'lucide-vue-next';
import { store, addCanal, updateCanal, deleteCanal, setUmbrales, persistNow, type Canal } from '../store';

const iconosPorTipo: Record<string, { icon: any; color: string; bg: string }> = {
  WhatsApp: { icon: MessageCircle, color: '#25D366', bg: '#F0FDF4' },
  Instagram: { icon: Instagram, color: '#E1306C', bg: '#FDF2F8' },
  Facebook: { icon: Facebook, color: '#1877F2', bg: '#EFF6FF' },
  Teléfono: { icon: Phone, color: '#38BDF8', bg: '#F0F9FF' },
  'Sitio web': { icon: Globe, color: '#7C3AED', bg: '#F5F3FF' },
};
const tiposCanal = ['WhatsApp', 'Instagram', 'Facebook', 'Teléfono', 'Sitio web'];
function cfg(canal: Canal) { return iconosPorTipo[canal.tipo] ?? { icon: Globe, color: '#64748B', bg: '#F8FAFC' }; }
function SeccionEncabezado({ icono, titulo, subtitulo, gradient }: { icono: any; titulo: string; subtitulo: string; gradient: string }) {
  return <div class="flex items-center gap-3 px-6 py-4 -mx-6 -mt-6 mb-6 rounded-t-2xl" style={{ background: gradient }}><div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.18)' }}>{icono}</div><div><div class="font-bold text-sm" style={{ color: '#fff' }}>{titulo}</div><div class="text-xs" style={{ color: 'rgba(255,255,255,0.70)' }}>{subtitulo}</div></div></div>;
}

export default defineComponent({
  name: 'Configuracion',
  setup() {
    const nuevoTipo = ref('WhatsApp');
    const nuevoId = ref('');
    const nuevaUrl = ref('');
    const guardado = ref(false);
    const caiDesbloqueado = ref(false);
    const modalContrasena = ref(false);
    const contrasena = ref('');
    const errorContrasena = ref(false);
    const umbralesForm = ref({ ...store.umbrales });

    const verificarContrasena = () => {
      if (contrasena.value === 'cai2024') {
        caiDesbloqueado.value = true; modalContrasena.value = false; contrasena.value = ''; errorContrasena.value = false;
      } else errorContrasena.value = true;
    };
    const agregarCanalNuevo = () => {
      if (!nuevoId.value.trim()) return;
      addCanal({ tipo: nuevoTipo.value, identificador: nuevoId.value, url: nuevaUrl.value || '#', activo: true });
      nuevoId.value = ''; nuevaUrl.value = '';
    };
    const guardar = () => {
      setUmbrales({ ...umbralesForm.value });
      persistNow();
      guardado.value = true;
      setTimeout(() => (guardado.value = false), 2200);
    };

    return () => {
      const canalesActivos = store.canales.filter((c) => c.activo);
      return (
        <div class="space-y-6">
          <div class="rounded-2xl p-6 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.06)' }}>
            <SeccionEncabezado icono={<Building2 size={17} style={{ color: '#fff' }} />} titulo="Información del negocio" subtitulo="Nombre, RTN, correo y dirección principal" gradient="linear-gradient(135deg, #0F172A 0%, #1E293B 100%)" />
            <div class="grid grid-cols-2 gap-4">{[
              { label: 'Nombre del negocio', value: 'Turbo Auto F&M 504' }, { label: 'RTN', value: '0501-2015-00248' }, { label: 'Correo principal', value: 'admin@turboauto.com' }, { label: 'Dirección principal', value: 'Tegucigalpa, Honduras' },
            ].map((f) => <div key={f.label}><label class="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>{f.label}</label><input defaultValue={f.value} class="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#111827' }} /></div>)}</div>
          </div>

          <div class="rounded-2xl p-6 shadow-md" style={{ border: `2px solid ${caiDesbloqueado.value ? '#38BDF8' : '#1E3A5F'}` }}>
            <div class="flex items-center justify-between px-6 py-4 -mx-6 -mt-6 mb-6 rounded-t-2xl" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)' }}><div class="flex items-center gap-3"><div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.18)' }}><ShieldCheck size={17} style={{ color: '#38BDF8' }} /></div><div><div class="font-bold text-sm" style={{ color: '#fff' }}>Configuración fiscal — CAI</div><div class="text-xs" style={{ color: 'rgba(255,255,255,0.70)' }}>Código de Autorización de Impresión · SAR Honduras</div></div></div>{caiDesbloqueado.value ? <button onClick={() => (caiDesbloqueado.value = false)} class="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all" style={{ background: 'rgba(248,113,113,0.18)', color: '#F87171', border: '1px solid rgba(248,113,113,0.35)' }}><LockOpen size={13} /> Bloquear CAI</button> : <button onClick={() => { contrasena.value = ''; errorContrasena.value = false; modalContrasena.value = true; }} class="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all" style={{ background: 'rgba(56,189,248,0.18)', color: '#38BDF8', border: '1px solid rgba(56,189,248,0.35)' }}><Lock size={13} /> Desbloquear para editar</button>}</div>
            <div class="flex items-center gap-3 px-4 py-3 rounded-xl mb-5" style={{ background: caiDesbloqueado.value ? '#F0FDF4' : '#F8FBFF', border: `1px solid ${caiDesbloqueado.value ? '#BBF7D0' : '#BFDBFE'}` }}>{caiDesbloqueado.value ? <LockOpen size={14} style={{ color: '#16A34A' }} /> : <Lock size={14} style={{ color: '#1D4ED8' }} />}<p class="text-xs" style={{ color: caiDesbloqueado.value ? '#16A34A' : '#1D4ED8' }}>{caiDesbloqueado.value ? 'Sección desbloqueada. Puedes editar los datos fiscales.' : 'Esta sección está protegida. Ingresa la contraseña de configuración fiscal para modificar los datos del CAI.'}</p></div>
            <div class="grid grid-cols-2 lg:grid-cols-3 gap-4" style={{ opacity: caiDesbloqueado.value ? 1 : 0.55, transition: 'opacity 0.2s' }}>
              <div class="col-span-2 lg:col-span-3"><label class="block text-xs font-bold mb-1.5" style={{ color: '#1E3A5F' }}>CAI por defecto</label><input defaultValue="2F4A8B-C91E3D-7A2150-B4F839-DE6C02-A5" disabled={!caiDesbloqueado.value} class="w-full px-3 py-2.5 rounded-xl text-sm outline-none font-mono" style={{ background: '#EFF6FF', border: '2px solid #38BDF8', color: '#1D4ED8', cursor: caiDesbloqueado.value ? 'text' : 'not-allowed' }} /></div>
              {['001-001-01-00000001', '001-001-01-00000050', '001-001-01-00000038', '0501-2015-00248', 'Turbo Auto F&M 504 S. de R.L.', 'facturacion@turboauto.com'].map((value, idx) => <div key={value}><label class="block text-xs font-bold mb-1.5" style={{ color: '#1E3A5F' }}>{['Rango autorizado — inicio', 'Rango autorizado — fin', 'Número de factura actual', 'RTN del negocio', 'Razón social', 'Correo fiscal'][idx]}</label><input defaultValue={value} disabled={!caiDesbloqueado.value} class="w-full px-3 py-2.5 rounded-xl text-xs outline-none" style={{ background: '#F8FAFC', border: '1px solid #BFDBFE', color: '#111827', cursor: caiDesbloqueado.value ? 'text' : 'not-allowed' }} /></div>)}
            </div>
          </div>

          <div class="grid lg:grid-cols-2 gap-6">
            <div class="rounded-2xl p-6 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.06)' }}>
              <SeccionEncabezado icono={<MessageCircle size={17} style={{ color: '#fff' }} />} titulo="Canales de contacto" subtitulo="WhatsApp, redes sociales y teléfono" gradient="linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)" />
              <div class="space-y-3 mb-5">{store.canales.map((canal) => { const c = cfg(canal); const Icon = c.icon; return <div key={canal.id} class="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}><div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: c.bg }}><Icon size={16} style={{ color: c.color }} /></div><div class="flex-1 min-w-0"><div class="text-xs font-bold" style={{ color: '#374151' }}>{canal.tipo}</div><div class="text-xs truncate" style={{ color: '#94A3B8' }}>{canal.identificador}</div></div><div class="flex items-center gap-2"><button onClick={() => updateCanal(canal.id, { activo: !canal.activo })} class="flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-semibold transition-colors" style={{ background: canal.activo ? '#F0FDF4' : '#F8FAFC', color: canal.activo ? '#16A34A' : '#94A3B8' }}>{canal.activo ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}{canal.activo ? 'Activo' : 'Inactivo'}</button><button onClick={() => deleteCanal(canal.id)} class="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#FEF2F2' }}><Trash2 size={13} style={{ color: '#F87171' }} /></button></div></div>; })}</div>
              <div class="rounded-2xl p-4" style={{ background: '#F8FAFC', border: '1px dashed #BAE6FD' }}><div class="flex items-center gap-2 mb-3"><Plus size={14} style={{ color: '#38BDF8' }} /><span class="text-xs font-bold" style={{ color: '#0F172A' }}>Agregar canal nuevo</span></div><div class="grid grid-cols-2 gap-3"><select value={nuevoTipo.value} onChange={(e) => (nuevoTipo.value = (e.target as HTMLSelectElement).value)} class="px-3 py-2.5 rounded-xl text-xs outline-none" style={{ background: '#fff', border: '1px solid #E2E8F0', color: '#374151' }}>{tiposCanal.map((t) => <option key={t}>{t}</option>)}</select><input value={nuevoId.value} onChange={(e) => (nuevoId.value = (e.target as HTMLInputElement).value)} placeholder="Usuario, número o nombre" class="px-3 py-2.5 rounded-xl text-xs outline-none" style={{ background: '#fff', border: '1px solid #E2E8F0', color: '#111827' }} /><input value={nuevaUrl.value} onChange={(e) => (nuevaUrl.value = (e.target as HTMLInputElement).value)} placeholder="URL o enlace" class="col-span-2 px-3 py-2.5 rounded-xl text-xs outline-none" style={{ background: '#fff', border: '1px solid #E2E8F0', color: '#111827' }} /><button onClick={agregarCanalNuevo} class="col-span-2 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold" style={{ background: '#0F172A', color: '#fff' }}><Plus size={12} /> Agregar canal</button></div></div>
            </div>

            <div class="rounded-2xl p-6 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.06)' }}>
              <SeccionEncabezado icono={<Eye size={17} style={{ color: '#fff' }} />} titulo="Vista previa de tienda pública" subtitulo="Se actualiza con los canales activos" gradient="linear-gradient(135deg, #1E293B 0%, #0F172A 100%)" />
              <div class="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}><div class="flex items-center gap-3 mb-4"><div class="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#38BDF8' }}><Globe size={18} style={{ color: '#0F172A' }} /></div><div><div class="text-white font-bold">Turbo Auto F&M 504</div><div class="text-xs" style={{ color: '#94A3B8' }}>Catálogo público</div></div></div><div class="space-y-2">{canalesActivos.map((canal) => { const c = cfg(canal); const Icon = c.icon; return <a key={canal.id} href={canal.url || '#'} target="_blank" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.08)' }}><Icon size={17} style={{ color: c.color }} /><div><div class="text-xs font-bold" style={{ color: '#fff' }}>Contactar por {canal.tipo}</div><div class="text-xs" style={{ color: '#94A3B8' }}>{canal.identificador}</div></div></a>; })}{canalesActivos.length === 0 && <div class="text-xs text-center py-6" style={{ color: '#94A3B8' }}>Sin canales activos configurados</div>}</div></div>
            </div>
          </div>

          <div class="rounded-2xl p-6 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.06)' }}>
            <SeccionEncabezado icono={<FileText size={17} style={{ color: '#fff' }} />} titulo="Umbrales de alertas de inventario" subtitulo="Define los límites para stock crítico, advertencias y sobrestock" gradient="linear-gradient(135deg, #FB923C 0%, #FDBA74 100%)" />
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">{[
              { label: 'Stock crítico (unidades)', field: 'critico' as const, color: '#F87171' },
              { label: 'Advertencia (unidades)', field: 'advertencia' as const, color: '#FB923C' },
              { label: 'Sobrestock (unidades)', field: 'sobrestock' as const, color: '#38BDF8' },
              { label: 'Días sin movimiento', field: 'diasSinMovimiento' as const, color: '#818CF8' },
            ].map((a) => <div key={a.field}><label class="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>{a.label}</label><input value={umbralesForm.value[a.field]} type="number" onChange={(e) => (umbralesForm.value = { ...umbralesForm.value, [a.field]: Number((e.target as HTMLInputElement).value) })} class="w-full px-3 py-2.5 rounded-xl text-sm outline-none font-bold" style={{ background: '#F8FAFC', border: `2px solid ${a.color}50`, color: a.color }} /></div>)}</div>
          </div>

          <div class="flex justify-end"><button onClick={guardar} class="flex items-center gap-2 px-7 py-3 rounded-xl font-semibold text-sm transition-all shadow-md" style={{ background: guardado.value ? 'linear-gradient(135deg,#22C55E,#16A34A)' : 'linear-gradient(135deg,#0F172A,#1E3A5F)', color: '#fff', boxShadow: guardado.value ? '0 4px 14px rgba(34,197,94,0.30)' : '0 4px 14px rgba(15,23,42,0.30)' }}><Save size={15} />{guardado.value ? '¡Cambios guardados!' : 'Guardar cambios'}</button></div>

          {modalContrasena.value && <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.65)' }}><div class="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden" style={{ background: '#fff' }}><div class="flex items-center justify-between px-6 py-5" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)' }}><div class="flex items-center gap-3"><div class="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(56,189,248,0.18)', border: '1px solid rgba(56,189,248,0.30)' }}><Lock size={17} style={{ color: '#38BDF8' }} /></div><div><div class="font-bold text-sm" style={{ color: '#fff' }}>Verificación requerida</div><div class="text-xs" style={{ color: '#7DD3FC' }}>Configuración fiscal — CAI</div></div></div><button onClick={() => (modalContrasena.value = false)} class="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.10)' }}><X size={15} style={{ color: '#94A3B8' }} /></button></div><div class="px-6 py-6 space-y-4"><p class="text-sm" style={{ color: '#374151' }}>Ingresa la contraseña especial de configuración fiscal para desbloquear y editar los datos del CAI.</p><div><label class="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Contraseña de configuración CAI</label><input type="password" value={contrasena.value} onChange={(e) => { contrasena.value = (e.target as HTMLInputElement).value; errorContrasena.value = false; }} onKeydown={(e: KeyboardEvent) => e.key === 'Enter' && verificarContrasena()} placeholder="••••••••" class="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: '#F8FAFC', border: errorContrasena.value ? '2px solid #F87171' : '2px solid #E2E8F0', color: '#111827' }} /></div>{errorContrasena.value && <div class="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}><AlertCircle size={14} style={{ color: '#F87171' }} /><span class="text-xs font-medium" style={{ color: '#DC2626' }}>Contraseña incorrecta. Intenta de nuevo.</span></div>}<div class="px-3 py-2 rounded-xl text-xs" style={{ background: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD' }}><strong>Demo:</strong> La contraseña del CAI es <code class="font-mono font-semibold">cai2024</code></div></div><div class="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid #F1F5F9' }}><button onClick={() => (modalContrasena.value = false)} class="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0' }}>Cancelar</button><button onClick={verificarContrasena} class="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: 'linear-gradient(135deg,#0F172A,#1E3A5F)', color: '#fff' }}>Desbloquear</button></div></div></div>}
        </div>
      );
    };
  },
});
</script>
