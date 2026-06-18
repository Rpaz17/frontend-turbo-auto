<script lang="tsx">
import { defineComponent, onMounted, ref, type PropType } from 'vue';
import { MessageCircle, Instagram, Facebook, Phone, Globe, Plus, Trash2, Eye, Save, ToggleLeft, ToggleRight, ShieldCheck, Building2, FileText, Lock, AlertCircle } from 'lucide-vue-next';
import { store, addCanal, updateCanal, deleteCanal, setUmbrales, persistNow, updateSucursalCai, getCaiSucursal, puedeEditarCai, type Canal, type CaiFiscal, type SesionUsuario } from '../store';
import { createRedSocial, deleteRedSocial, getRedesSociales, updateRedSocial } from '../api/ajustes';
import { ApiError } from '../lib/http';
import type { RedSocial } from '../api/schemas';

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

function redSocialToCanal(red: RedSocial): Canal {
  return {
    id: red.id,
    tipo: red.nombre,
    identificador: red.tipo,
    url: red.url,
    activo: red.activo,
  };
}

function messageFromError(err: unknown) {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'No se pudo conectar con el backend.';
}

export default defineComponent({
  name: 'Configuracion',
  props: {
    usuario: { type: Object as PropType<SesionUsuario>, required: true },
  },
  setup(props) {
    const nuevoTipo = ref('WhatsApp');
    const nuevoId = ref('');
    const nuevaUrl = ref('');
    const guardado = ref(false);
    const errorFiscal = ref('');
    const errorCanales = ref('');
    const cargandoCanales = ref(false);
    const sucursalFiscalId = ref(props.usuario.sucursalId);
    const caiForm = ref<CaiFiscal>({ ...getCaiSucursal(sucursalFiscalId.value) });
    const umbralesForm = ref({ ...store.umbrales });

    const admin = () => puedeEditarCai(props.usuario);
    const cargarCanales = async () => {
      cargandoCanales.value = true;
      errorCanales.value = '';
      try {
        const redes = await getRedesSociales();
        store.canales.splice(0, store.canales.length, ...redes.map(redSocialToCanal));
        persistNow();
      } catch (err) {
        errorCanales.value = messageFromError(err);
      } finally {
        cargandoCanales.value = false;
      }
    };

    onMounted(cargarCanales);

    const cargarCai = (sucursalId: string) => {
      sucursalFiscalId.value = sucursalId;
      caiForm.value = { ...getCaiSucursal(sucursalId) };
      errorFiscal.value = '';
    };

    const agregarCanalNuevo = async () => {
      if (!nuevoId.value.trim()) return;
      errorCanales.value = '';
      try {
        await createRedSocial({
          nombre: nuevoTipo.value,
          tipo: nuevoId.value,
          url: nuevaUrl.value || 'https://example.com',
          activo: true,
        });
        await cargarCanales();
        nuevoId.value = ''; nuevaUrl.value = '';
      } catch (err) {
        errorCanales.value = messageFromError(err);
        addCanal({ tipo: nuevoTipo.value, identificador: nuevoId.value, url: nuevaUrl.value || '#', activo: true });
      }
    };

    const alternarCanal = async (canal: Canal) => {
      errorCanales.value = '';
      try {
        await updateRedSocial(canal.id, { activo: !canal.activo });
        await cargarCanales();
      } catch (err) {
        errorCanales.value = messageFromError(err);
        updateCanal(canal.id, { activo: !canal.activo });
      }
    };

    const eliminarCanal = async (id: number) => {
      errorCanales.value = '';
      try {
        await deleteRedSocial(id);
        await cargarCanales();
      } catch (err) {
        errorCanales.value = messageFromError(err);
        deleteCanal(id);
      }
    };

    const guardar = () => {
      errorFiscal.value = '';
      setUmbrales({ ...umbralesForm.value });
      if (admin()) {
        try {
          updateSucursalCai(sucursalFiscalId.value, { ...caiForm.value }, props.usuario);
        } catch (err) {
          errorFiscal.value = err instanceof Error ? err.message : 'No se pudo guardar el CAI.';
          return;
        }
      }
      persistNow();
      guardado.value = true;
      setTimeout(() => (guardado.value = false), 2200);
    };

    return () => {
      const canalesActivos = store.canales.filter((c) => c.activo);
      const puedeCambiarCai = admin();
      return (
        <div class="space-y-6">
          <div class="rounded-2xl p-6 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.06)' }}>
            <SeccionEncabezado icono={<Building2 size={17} style={{ color: '#fff' }} />} titulo="Información del negocio" subtitulo="Nombre, RTN, correo y dirección principal" gradient="linear-gradient(135deg, #0F172A 0%, #1E293B 100%)" />
            <div class="grid grid-cols-2 gap-4">{[
              { label: 'Nombre del negocio', value: 'Turbo Auto F&M 504' }, { label: 'RTN', value: caiForm.value.rtn }, { label: 'Correo principal', value: caiForm.value.correoFiscal }, { label: 'Dirección principal', value: 'Tegucigalpa, Honduras' },
            ].map((f) => <div key={f.label}><label class="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>{f.label}</label><input value={f.value} readonly class="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#111827' }} /></div>)}</div>
          </div>

          <div class="rounded-2xl p-6 shadow-md" style={{ border: `2px solid ${puedeCambiarCai ? '#38BDF8' : '#1E3A5F'}` }}>
            <div class="flex items-center justify-between px-6 py-4 -mx-6 -mt-6 mb-6 rounded-t-2xl" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)' }}>
              <div class="flex items-center gap-3"><div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.18)' }}><ShieldCheck size={17} style={{ color: '#38BDF8' }} /></div><div><div class="font-bold text-sm" style={{ color: '#fff' }}>Configuración fiscal por sucursal</div><div class="text-xs" style={{ color: 'rgba(255,255,255,0.70)' }}>CAI, rango autorizado y software registrado ante el país</div></div></div>
              <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ background: puedeCambiarCai ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.08)', color: puedeCambiarCai ? '#86EFAC' : '#CBD5E1', border: '1px solid rgba(255,255,255,0.18)' }}><Lock size={13} /> {puedeCambiarCai ? 'Admin autorizado' : 'Solo lectura'}</div>
            </div>

            <div class="flex items-center gap-3 px-4 py-3 rounded-xl mb-5" style={{ background: puedeCambiarCai ? '#F0FDF4' : '#F8FBFF', border: `1px solid ${puedeCambiarCai ? '#BBF7D0' : '#BFDBFE'}` }}>
              {puedeCambiarCai ? <ShieldCheck size={14} style={{ color: '#16A34A' }} /> : <AlertCircle size={14} style={{ color: '#1D4ED8' }} />}
              <p class="text-xs" style={{ color: puedeCambiarCai ? '#16A34A' : '#1D4ED8' }}>{puedeCambiarCai ? 'Puedes editar el CAI de cualquier sucursal. Los cambios se aplican a facturación inmediatamente.' : 'Tu usuario no puede modificar datos fiscales. El CAI mostrado corresponde a tu sucursal de login.'}</p>
            </div>

            <div class="grid grid-cols-2 lg:grid-cols-3 gap-4" style={{ opacity: puedeCambiarCai ? 1 : 0.68, transition: 'opacity 0.2s' }}>
              <div>
                <label class="block text-xs font-bold mb-1.5" style={{ color: '#1E3A5F' }}>Sucursal fiscal</label>
                <select value={sucursalFiscalId.value} disabled={!puedeCambiarCai} onInput={(e) => cargarCai((e.target as HTMLSelectElement).value)} class="w-full px-3 py-2.5 rounded-xl text-xs outline-none" style={{ background: '#fff', border: '1px solid #BFDBFE', color: '#1E3A5F', cursor: puedeCambiarCai ? 'pointer' : 'not-allowed' }}>
                  {store.sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
              {[
                { label: 'CAI', field: 'numero' as const, wide: true },
                { label: 'Rango autorizado - inicio', field: 'rangoInicio' as const },
                { label: 'Rango autorizado - fin', field: 'rangoFin' as const },
                { label: 'Número de factura actual', field: 'facturaActual' as const },
                { label: 'Fecha límite de emisión', field: 'fechaLimite' as const, type: 'date' },
                { label: 'RTN del negocio', field: 'rtn' as const },
                { label: 'Razón social', field: 'razonSocial' as const },
                { label: 'Correo fiscal', field: 'correoFiscal' as const },
                { label: 'Software registrado en CAI', field: 'software' as const, wide: true },
              ].map((f) => <div key={f.field} class={f.wide ? 'col-span-2 lg:col-span-3' : ''}><label class="block text-xs font-bold mb-1.5" style={{ color: '#1E3A5F' }}>{f.label}</label><input type={f.type ?? 'text'} value={caiForm.value[f.field]} disabled={!puedeCambiarCai} onInput={(e) => (caiForm.value = { ...caiForm.value, [f.field]: (e.target as HTMLInputElement).value })} class="w-full px-3 py-2.5 rounded-xl text-xs outline-none" style={{ background: f.field === 'numero' ? '#EFF6FF' : '#F8FAFC', border: f.field === 'numero' ? '2px solid #38BDF8' : '1px solid #BFDBFE', color: '#111827', cursor: puedeCambiarCai ? 'text' : 'not-allowed' }} /></div>)}
            </div>
            {errorFiscal.value && <div class="mt-4 px-4 py-3 rounded-xl text-xs font-semibold" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>{errorFiscal.value}</div>}
          </div>

          <div class="grid lg:grid-cols-2 gap-6">
            <div class="rounded-2xl p-6 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.06)' }}>
              <SeccionEncabezado icono={<MessageCircle size={17} style={{ color: '#fff' }} />} titulo="Canales de contacto" subtitulo="WhatsApp, redes sociales y teléfono" gradient="linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)" />
              {errorCanales.value && <div class="mb-3 px-3 py-2 rounded-xl text-xs font-semibold" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>{errorCanales.value}</div>}
              {cargandoCanales.value && <div class="mb-3 px-3 py-2 rounded-xl text-xs font-semibold" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8' }}>Cargando canales...</div>}
              <div class="space-y-3 mb-5">{store.canales.map((canal) => { const c = cfg(canal); const Icon = c.icon; return <div key={canal.id} class="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}><div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: c.bg }}><Icon size={16} style={{ color: c.color }} /></div><div class="flex-1 min-w-0"><div class="text-xs font-bold" style={{ color: '#374151' }}>{canal.tipo}</div><div class="text-xs truncate" style={{ color: '#94A3B8' }}>{canal.identificador}</div></div><div class="flex items-center gap-2"><button onClick={() => alternarCanal(canal)} class="flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-semibold transition-colors" style={{ background: canal.activo ? '#F0FDF4' : '#F8FAFC', color: canal.activo ? '#16A34A' : '#94A3B8' }}>{canal.activo ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}{canal.activo ? 'Activo' : 'Inactivo'}</button><button onClick={() => eliminarCanal(canal.id)} class="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#FEF2F2' }}><Trash2 size={13} style={{ color: '#F87171' }} /></button></div></div>; })}</div>
              <div class="rounded-2xl p-4" style={{ background: '#F8FAFC', border: '1px dashed #BAE6FD' }}><div class="flex items-center gap-2 mb-3"><Plus size={14} style={{ color: '#38BDF8' }} /><span class="text-xs font-bold" style={{ color: '#0F172A' }}>Agregar canal nuevo</span></div><div class="grid grid-cols-2 gap-3"><select value={nuevoTipo.value} onInput={(e) => (nuevoTipo.value = (e.target as HTMLSelectElement).value)} class="px-3 py-2.5 rounded-xl text-xs outline-none" style={{ background: '#fff', border: '1px solid #E2E8F0', color: '#374151' }}>{tiposCanal.map((t) => <option key={t}>{t}</option>)}</select><input value={nuevoId.value} onInput={(e) => (nuevoId.value = (e.target as HTMLInputElement).value)} placeholder="Usuario, número o nombre" class="px-3 py-2.5 rounded-xl text-xs outline-none" style={{ background: '#fff', border: '1px solid #E2E8F0', color: '#111827' }} /><input value={nuevaUrl.value} onInput={(e) => (nuevaUrl.value = (e.target as HTMLInputElement).value)} placeholder="URL o enlace" class="col-span-2 px-3 py-2.5 rounded-xl text-xs outline-none" style={{ background: '#fff', border: '1px solid #E2E8F0', color: '#111827' }} /><button onClick={agregarCanalNuevo} class="col-span-2 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold" style={{ background: '#0F172A', color: '#fff' }}><Plus size={12} /> Agregar canal</button></div></div>
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
            ].map((a) => <div key={a.field}><label class="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>{a.label}</label><input value={umbralesForm.value[a.field]} type="number" onInput={(e) => (umbralesForm.value = { ...umbralesForm.value, [a.field]: Number((e.target as HTMLInputElement).value) })} class="w-full px-3 py-2.5 rounded-xl text-sm outline-none font-bold" style={{ background: '#F8FAFC', border: `2px solid ${a.color}50`, color: a.color }} /></div>)}</div>
          </div>

          <div class="flex justify-end"><button onClick={guardar} class="flex items-center gap-2 px-7 py-3 rounded-xl font-semibold text-sm transition-all shadow-md" style={{ background: guardado.value ? 'linear-gradient(135deg,#22C55E,#16A34A)' : 'linear-gradient(135deg,#0F172A,#1E3A5F)', color: '#fff', boxShadow: guardado.value ? '0 4px 14px rgba(34,197,94,0.30)' : '0 4px 14px rgba(15,23,42,0.30)' }}><Save size={15} />{guardado.value ? 'Cambios guardados' : 'Guardar cambios'}</button></div>
        </div>
      );
    };
  },
});
</script>
