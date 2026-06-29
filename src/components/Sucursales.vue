<script lang="tsx">
import { computed, defineComponent, onMounted, ref } from 'vue';
import { AlertCircle, Building2, Calendar, Edit2, FileText, Loader2, MapPin, Plus, RefreshCw, ShieldCheck, Trash2, X } from 'lucide-vue-next';
import { createSucursal, deleteSucursal, getSucursales, updateSucursal } from '../api/sucursales';
import { createCai, createCaiRango, getCaiRangos, getCais } from '../api/cai';
import type { Cai, CaiRango, Sucursal } from '../api/schemas';

interface SucursalForm {
  nombre: string;
  direccion: string;
  codigo_facturacion: string;
  cai_descripcion: string;
  codigo_cai: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  punto_emision: string;
  tipo_documento: string;
  rango_inicio: string;
  rango_final: string;
  correlativo_actual: string;
}

const formVacio: SucursalForm = {
  nombre: '',
  direccion: '',
  codigo_facturacion: '',
  cai_descripcion: '',
  codigo_cai: '',
  fecha_emision: '',
  fecha_vencimiento: '',
  punto_emision: '001',
  tipo_documento: '01',
  rango_inicio: '1',
  rango_final: '',
  correlativo_actual: '0',
};

function hoyInput() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatFecha(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('es-HN') : '-';
}

function errorMessage(err: any) {
  const message = err?.data?.message ?? err?.message;
  if (Array.isArray(message)) return message.join(', ');
  return typeof message === 'string' ? message : 'Ocurrió un error inesperado.';
}

export default defineComponent({
  name: 'Sucursales',
  setup() {
    const sucursales = ref<Sucursal[]>([]);
    const cais = ref<Cai[]>([]);
    const rangos = ref<CaiRango[]>([]);
    const loading = ref(false);
    const guardando = ref(false);
    const error = ref('');
    const modal = ref(false);
    const sucursalEditando = ref<Sucursal | null>(null);
    const form = ref<SucursalForm>({ ...formVacio, fecha_emision: hoyInput() });

    const cargarDatos = async () => {
      loading.value = true;
      error.value = '';
      try {
        const [sucursalesRes, caisRes, rangosRes] = await Promise.all([getSucursales(), getCais(), getCaiRangos()]);
        sucursales.value = sucursalesRes;
        cais.value = caisRes;
        rangos.value = rangosRes;
      } catch (err: any) {
        error.value = errorMessage(err);
      } finally {
        loading.value = false;
      }
    };

    onMounted(cargarDatos);

    const abrirModalNueva = () => {
      sucursalEditando.value = null;
      form.value = { ...formVacio, fecha_emision: hoyInput() };
      modal.value = true;
      error.value = '';
    };

    const abrirModalEditar = (sucursal: Sucursal) => {
      const caiSucursal = caisPorSucursal(sucursal.id)[0] ?? null;
      const rangosCai = caiSucursal ? rangosPorCai(caiSucursal.id) : [];
      const rangoSucursal = rangosCai.find((rango) => rango.estado === 'ACTIVO') ?? rangosCai[0] ?? null;

      sucursalEditando.value = sucursal;
      form.value = {
        ...formVacio,
        nombre: sucursal.nombre,
        direccion: sucursal.direccion,
        codigo_facturacion: sucursal.codigo_facturacion ?? '',
        cai_descripcion: caiSucursal?.descripcion ?? '',
        codigo_cai: caiSucursal?.codigo_cai ?? '',
        fecha_emision: caiSucursal?.fecha_emision ? caiSucursal.fecha_emision.slice(0, 10) : hoyInput(),
        fecha_vencimiento: caiSucursal?.fecha_vencimiento ? caiSucursal.fecha_vencimiento.slice(0, 10) : '',
        punto_emision: rangoSucursal?.punto_emision ?? '001',
        tipo_documento: rangoSucursal?.tipo_documento ?? '01',
        rango_inicio: rangoSucursal ? String(rangoSucursal.rango_inicio) : '1',
        rango_final: rangoSucursal ? String(rangoSucursal.rango_final) : '',
        correlativo_actual: rangoSucursal ? String(rangoSucursal.correlativo_actual) : '0',
      };
      modal.value = true;
      error.value = '';
    };

    const cerrarModal = () => {
      modal.value = false;
      sucursalEditando.value = null;
      form.value = { ...formVacio, fecha_emision: hoyInput() };
    };

    const puedeGuardarCai = computed(() => !sucursalEditando.value && Boolean(form.value.codigo_cai.trim()));

    const validar = () => {
      if (!form.value.nombre.trim()) return 'El nombre de la sucursal es obligatorio.';
      if (!form.value.direccion.trim()) return 'La dirección es obligatoria.';
      if (!/^\d{3}$/.test(form.value.codigo_facturacion.trim())) return 'El código de facturación debe tener exactamente 3 dígitos.';
      if (!puedeGuardarCai.value) return '';
      if (!form.value.cai_descripcion.trim()) return 'La descripción del CAI es obligatoria.';
      if (!form.value.fecha_emision) return 'La fecha de emisión del CAI es obligatoria.';
      if (!form.value.fecha_vencimiento) return 'La fecha de vencimiento del CAI es obligatoria.';
      if (!/^\d{3}$/.test(form.value.punto_emision.trim())) return 'El punto de emisión debe tener 3 dígitos.';
      if (!/^\d{2}$/.test(form.value.tipo_documento.trim())) return 'El tipo de documento debe tener 2 dígitos.';
      if (!form.value.rango_final || Number(form.value.rango_final) < Number(form.value.rango_inicio)) return 'El rango final debe ser mayor o igual al rango inicial.';
      return '';
    };

    const guardarSucursal = async () => {
      const validationError = validar();
      if (validationError) {
        error.value = validationError;
        return;
      }

      guardando.value = true;
      error.value = '';
      try {
        const payload = {
          nombre: form.value.nombre.trim(),
          direccion: form.value.direccion.trim(),
          codigo_facturacion: form.value.codigo_facturacion.trim(),
        };

        const response = sucursalEditando.value ? await updateSucursal(sucursalEditando.value.id, payload) : await createSucursal(payload);
        const sucursal = response.data as Sucursal;

        if (puedeGuardarCai.value) {
          const caiPayload = {
            descripcion: form.value.cai_descripcion.trim(),
            codigo_cai: form.value.codigo_cai.trim(),
            fecha_emision: form.value.fecha_emision,
            fecha_vencimiento: form.value.fecha_vencimiento,
            sucursal_id: Number(sucursal.id),
          };

          const cai = await createCai(caiPayload);

          const rangoPayload = {
            cai_id: cai.id,
            punto_emision: form.value.punto_emision.trim(),
            tipo_documento: form.value.tipo_documento.trim(),
            rango_inicio: Number(form.value.rango_inicio),
            rango_final: Number(form.value.rango_final),
            correlativo_actual: Number(form.value.correlativo_actual || 0),
          };

          await createCaiRango(rangoPayload);
        }

        cerrarModal();
        await cargarDatos();
      } catch (err: any) {
        error.value = errorMessage(err);
      } finally {
        guardando.value = false;
      }
    };

    const eliminarSucursal = async (sucursal: Sucursal) => {
      if (!confirm(`¿Eliminar ${sucursal.nombre}?`)) return;
      loading.value = true;
      error.value = '';
      try {
        await deleteSucursal(sucursal.id);
        await cargarDatos();
      } catch (err: any) {
        error.value = errorMessage(err);
      } finally {
        loading.value = false;
      }
    };

    const caisPorSucursal = (sucursalId: string | number) => cais.value.filter((cai) => cai.sucursal_id === String(sucursalId));
    const rangosPorCai = (caiId: string) => rangos.value.filter((rango) => rango.cai_id === caiId);

    return () => {
      const rangosActivos = rangos.value.filter((rango) => rango.estado === 'ACTIVO').length;

      return (
        <div class="space-y-5">
          {error.value && <div class="rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-2" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}><AlertCircle size={16} /> {error.value}</div>}

          <div class="flex items-center justify-between gap-4">
            <div class="grid grid-cols-3 gap-4 flex-1">
              {[
                { label: 'Sucursales', value: sucursales.value.length.toLocaleString('es-HN') },
                { label: 'CAI registrados', value: cais.value.length.toLocaleString('es-HN') },
                { label: 'Rangos activos', value: rangosActivos.toLocaleString('es-HN') },
              ].map((item) => <div key={item.label} class="rounded-2xl px-5 py-4 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.06)' }}><div class="text-xl font-bold" style={{ color: '#0F172A' }}>{item.value}</div><div class="text-xs" style={{ color: '#64748B' }}>{item.label}</div></div>)}
            </div>
            <div class="flex gap-2">
              <button onClick={cargarDatos} disabled={loading.value} class="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold" style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #E2E8F0' }}>{loading.value ? <Loader2 class="animate-spin" size={15} /> : <RefreshCw size={15} />} Actualizar</button>
              <button onClick={abrirModalNueva} class="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold" style={{ background: '#0F172A', color: '#fff' }}><Plus size={15} /> Agregar sucursal</button>
            </div>
          </div>

          <div class="grid lg:grid-cols-3 gap-5">
            {sucursales.value.map((sucursal) => {
              const caisSucursal = caisPorSucursal(sucursal.id);
              const activo = caisSucursal.flatMap((cai) => rangosPorCai(cai.id)).find((rango) => rango.estado === 'ACTIVO');
              return (
                <div key={String(sucursal.id)} class="rounded-2xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.06)' }}>
                  <div class="p-5" style={{ background: 'linear-gradient(135deg, #0F172A, #1E293B)' }}>
                    <div class="flex items-start justify-between mb-3"><div class="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(56,189,248,0.2)' }}><Building2 size={18} style={{ color: '#38BDF8' }} /></div><span class="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: 'rgba(134,239,172,0.15)', color: '#86EFAC' }}>Código {sucursal.codigo_facturacion ?? '---'}</span></div>
                    <h3 class="font-bold text-white mb-0.5">{sucursal.nombre}</h3>
                    <div class="flex items-start gap-1.5"><MapPin size={11} class="mt-0.5 flex-shrink-0" style={{ color: '#64748B' }} /><span class="text-xs leading-relaxed" style={{ color: '#94A3B8' }}>{sucursal.direccion}</span></div>
                  </div>
                  <div class="p-5 space-y-4">
                    <div class="rounded-xl p-3" style={{ background: activo ? '#F0FDF4' : '#FFF7ED', border: `1px solid ${activo ? '#BBF7D0' : '#FDBA74'}` }}>
                      <div class="flex items-center gap-2 mb-1"><ShieldCheck size={13} style={{ color: activo ? '#16A34A' : '#C2410C' }} /><span class="text-xs font-bold" style={{ color: activo ? '#16A34A' : '#C2410C' }}>{activo ? 'CAI activo' : 'Sin rango activo'}</span></div>
                      <div class="text-xs" style={{ color: '#64748B' }}>{activo ? `Rango ${activo.rango_inicio} - ${activo.rango_final} · Actual ${activo.correlativo_actual}` : 'Agrega un CAI y rango para facturar en esta sucursal.'}</div>
                    </div>

                    <div class="space-y-2">
                      {caisSucursal.length ? caisSucursal.map((cai) => <div key={cai.id} class="rounded-xl p-3" style={{ background: '#F8FAFC' }}><div class="text-xs font-bold truncate" style={{ color: '#0F172A' }}>{cai.descripcion}</div><div class="text-xs font-mono truncate mt-1" style={{ color: '#64748B' }}>{cai.codigo_cai}</div><div class="flex items-center gap-1 mt-2 text-xs" style={{ color: '#94A3B8' }}><Calendar size={11} /> Vence {formatFecha(cai.fecha_vencimiento)}</div></div>) : <div class="text-xs p-4 text-center rounded-xl" style={{ background: '#F8FAFC', color: '#94A3B8' }}>Sin CAI registrado</div>}
                    </div>

                    <div class="flex gap-2"><button onClick={() => abrirModalEditar(sucursal)} class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold" style={{ background: '#F8FAFC', color: '#374151', border: '1px solid #E2E8F0' }}><Edit2 size={12} /> Editar</button><button onClick={() => eliminarSucursal(sucursal)} class="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#FEF2F2' }}><Trash2 size={13} style={{ color: '#F87171' }} /></button></div>
                  </div>
                </div>
              );
            })}
          </div>

          {modal.value && <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.5)' }}><div class="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden" style={{ background: '#fff' }}><div class="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #F1F5F9' }}><h2 class="font-bold" style={{ color: '#0F172A' }}>{sucursalEditando.value ? 'Editar sucursal' : 'Agregar sucursal'}</h2><button onClick={cerrarModal} class="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#F8FAFC' }}><X size={15} style={{ color: '#64748B' }} /></button></div><div class="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            <div class="grid md:grid-cols-3 gap-4">{[{ label: 'Nombre de la sucursal', field: 'nombre' as const, placeholder: 'Ej. Sucursal Occidente', span: 'md:col-span-2' }, { label: 'Código facturación', field: 'codigo_facturacion' as const, placeholder: '001', span: '' }, { label: 'Dirección completa', field: 'direccion' as const, placeholder: 'Calle, colonia, ciudad', span: 'md:col-span-3' }].map((item) => <div key={item.field} class={item.span}><label class="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>{item.label}</label><input value={form.value[item.field]} onInput={(e) => (form.value = { ...form.value, [item.field]: (e.target as HTMLInputElement).value })} placeholder={item.placeholder} class="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#111827' }} /></div>)}</div>
            <div class="rounded-2xl p-4" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}><div class="flex items-center gap-2 mb-4"><FileText size={15} style={{ color: '#38BDF8' }} /><h3 class="text-sm font-bold" style={{ color: '#0F172A' }}>CAI de la sucursal</h3><span class="text-xs" style={{ color: '#94A3B8' }}>{sucursalEditando.value ? 'Solo lectura' : 'Opcional'}</span></div>{sucursalEditando.value && <div class="rounded-xl px-3 py-2 mb-4 text-xs font-semibold" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8' }}>Los datos del CAI se editan únicamente en Configuración fiscal.</div>}<div class="grid md:grid-cols-2 gap-4">{[
              { label: 'Descripción CAI', field: 'cai_descripcion' as const, placeholder: 'CAI Principal 2026', type: 'text' },
              { label: 'Código CAI', field: 'codigo_cai' as const, placeholder: '69904E-...', type: 'text' },
              { label: 'Fecha emisión', field: 'fecha_emision' as const, placeholder: '', type: 'date' },
              { label: 'Fecha vencimiento', field: 'fecha_vencimiento' as const, placeholder: '', type: 'date' },
              { label: 'Punto emisión', field: 'punto_emision' as const, placeholder: '001', type: 'text' },
              { label: 'Tipo documento', field: 'tipo_documento' as const, placeholder: '01', type: 'text' },
              { label: 'Rango inicio', field: 'rango_inicio' as const, placeholder: '1', type: 'number' },
              { label: 'Rango final', field: 'rango_final' as const, placeholder: '50', type: 'number' },
              { label: 'Correlativo actual', field: 'correlativo_actual' as const, placeholder: '0', type: 'number' },
            ].map((item) => <div key={item.field}><label class="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>{item.label}</label><input type={item.type} disabled={Boolean(sucursalEditando.value)} value={form.value[item.field]} onInput={(e) => (form.value = { ...form.value, [item.field]: (e.target as HTMLInputElement).value })} placeholder={item.placeholder} class="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: sucursalEditando.value ? '#F1F5F9' : '#fff', border: '1px solid #E2E8F0', color: sucursalEditando.value ? '#64748B' : '#111827', cursor: sucursalEditando.value ? 'not-allowed' : 'text' }} /></div>)}</div></div>
          </div><div class="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid #F1F5F9' }}><button onClick={cerrarModal} class="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0' }}>Cancelar</button><button onClick={guardarSucursal} disabled={guardando.value} class="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: guardando.value ? '#94A3B8' : '#0F172A', color: '#fff' }}>{guardando.value ? 'Guardando...' : sucursalEditando.value ? 'Actualizar sucursal' : 'Guardar sucursal'}</button></div></div></div>}
        </div>
      );
    };
  },
});
</script>
