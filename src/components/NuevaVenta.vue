<script lang="tsx">
<<<<<<< HEAD
import { defineComponent, ref, computed, onMounted } from 'vue';
import {
  Search, Plus, Trash2, FileText, Printer, Eye, ChevronDown,
  User, Package, ShieldCheck, Lock, Save, X,
  CreditCard, Banknote, Wrench, Loader2, AlertCircle
=======
import { computed, defineComponent, onMounted, ref, type PropType } from 'vue';
import {
  Search, Plus, Trash2, FileText, Printer, Eye, ChevronDown,
  User, Package, ShieldCheck, Save, X,
  CreditCard, Banknote, Wrench,
>>>>>>> 84ac276 (Conecta frontend con inventario y facturacion)
} from "lucide-vue-next";
import { useProductos, formatPrecio } from '../composables/useProductos';
import { useClientes } from '../composables/useClientes';
import { useSucursales } from '../composables/useSucursales';
import type { Product, Client, Sucursal } from '../api/schemas';
import { generateFactura, exportFactura, getUserIdFromToken } from '../api';
import { getCaiSucursal, getSucursalActiva, store, type SesionUsuario } from '../store';
import { generateFactura } from '../api/facturas';
import { getClients } from '../api/clientes';
import { getInventario } from '../api/inventario';
import { getProducts } from '../api/products';
import { getServicios } from '../api/servicios';
import { ApiError } from '../lib/http';

interface LineaProducto {
  id: number;
  nombre: string;
  codigo: string;
  producto_id: string;
  cantidad: number;
  precio: number;
  descuento: number;
  exento: boolean;
  exonerado: boolean;
}

interface LineaServicio {
  id: number;
  descripcion: string;
  total: number;
  nota_interna?: string;
}

<<<<<<< HEAD
const CAI_PREDETERMINADO = {
  numero: "2F4A8B-C91E3D-7A2150-B4F839-DE6C02-A5",
  rangoInicio: "001-001-01-00000001",
  rangoFin:    "001-001-01-00000050",
  facturaActual: "001-001-01-00000038",
  fechaLimite: "2025-03-31",
  rtn: "0501-2015-00248",
};
=======
interface ProductoDisponible {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
  codigo?: string;
  tipo?: string;
  proveedor?: string;
}

interface ServicioDisponible {
  id: string;
  descripcion: string;
  precio: number;
  categoria?: string;
  notas?: string;
}

interface ClienteDisponible {
  id: string;
  nombre: string;
  rtn?: string | null;
}
>>>>>>> 84ac276 (Conecta frontend con inventario y facturacion)

// Extrae el número secuencial del formato 001-001-01-XXXXXXXX
function secuencial(correlativo: string): number {
  const parts = correlativo.split("-");
  return parseInt(parts[parts.length - 1] ?? "0", 10);
}

let lineaId = 1;
let servicioId = 1;


export default defineComponent({
  name: 'NuevaVenta',
  
  
  setup() {
    const { productos, loading: loadingProds } = useProductos();
    const { clientes, load: loadClientes, loading: loadingClientes } = useClientes();
    const { sucursales, load: loadSucursales } = useSucursales();

<<<<<<< HEAD
    onMounted(() => {
      loadClientes();
      loadSucursales();
    });

    const clienteId = ref("");
    const sucursalId = ref("");
    const busqProd = ref("");
    const lineas = ref<LineaProducto[]>([]);
    const servicios = ref<LineaServicio[]>([]);
    const vistaPrevia = ref(false);
    const tipoPago = ref<"contado" | "credito">("contado");
=======
  const productosDisponibles = ref<ProductoDisponible[]>([]);
  const serviciosDisponibles = ref<ServicioDisponible[]>([]);
  const clientesDisponibles = ref<ClienteDisponible[]>([]);
  const cargandoDatos = ref(false);
  const guardandoFactura = ref(false);
  const errorFactura = ref("");
  const mensajeFactura = ref("");
  const cliente = ref("");
  const setCliente = (next: any) => { cliente.value = typeof next === 'function' ? next(cliente.value) : next; };
  const busqProd = ref("");
  const setBusqProd = (next: any) => { busqProd.value = typeof next === 'function' ? next(busqProd.value) : next; };
  const busqServ = ref("");
  const setBusqServ = (next: any) => { busqServ.value = typeof next === 'function' ? next(busqServ.value) : next; };
  const lineas = ref<LineaProducto[]>([]);
  const setLineas = (next: any) => { lineas.value = typeof next === 'function' ? next(lineas.value) : next; };
  const servicios = ref<LineaServicio[]>([]);
  const setServicios = (next: any) => { servicios.value = typeof next === 'function' ? next(servicios.value) : next; };
  const vistaPrevia = ref(false);
  const setVistaPrevia = (next: any) => { vistaPrevia.value = typeof next === 'function' ? next(vistaPrevia.value) : next; };
  const mostrarServicioPersonalizado = ref(false);
  const setMostrarServicioPersonalizado = (next: any) => { mostrarServicioPersonalizado.value = typeof next === 'function' ? next(mostrarServicioPersonalizado.value) : next; };
  const servicioPersonalizado = ref({ descripcion: "", precio: 0 });
  const setServicioPersonalizado = (next: any) => { servicioPersonalizado.value = typeof next === 'function' ? next(servicioPersonalizado.value) : next; };

  const sucursalId = ref(props.usuario.sucursalId);
  const setSucursalId = (next: any) => {
    if (props.usuario.rol !== 'admin') return;
    sucursalId.value = typeof next === 'function' ? next(sucursalId.value) : next;
    void cargarDatosFacturacion();
  };
  const tipoPago = ref<"contado" | "credito">("contado");
  const setTipoPago = (next: any) => { tipoPago.value = typeof next === 'function' ? next(tipoPago.value) : next; };
>>>>>>> 84ac276 (Conecta frontend con inventario y facturacion)

    // Inputs for manually adding a service
    const descServicio = ref("");
    const precioServicio = ref<number | null>(null);

<<<<<<< HEAD
    const caiNumero = CAI_PREDETERMINADO.numero;
    const caiRangoInicio = CAI_PREDETERMINADO.rangoInicio;
    const caiRangoFin = CAI_PREDETERMINADO.rangoFin;
    const caiFactura = CAI_PREDETERMINADO.facturaActual;
    const caiFecha = CAI_PREDETERMINADO.fechaLimite;
    const caiRtn = CAI_PREDETERMINADO.rtn;

    const ISV15 = 0.15;

    const agregarProducto = (p: Product) => {
      lineas.value.push({
=======
  const agregarProducto = (p: ProductoDisponible) => {
    if (p.stock <= 0) return;
    setLineas((prev) => [
      ...prev,
      {
>>>>>>> 84ac276 (Conecta frontend con inventario y facturacion)
        id: lineaId++,
        nombre: p.nombre,
        codigo: p.codigo,
        producto_id: p.id,
        cantidad: 1,
        precio: Number(p.precio),
        descuento: 0,
        exento: false,
        exonerado: false,
      });
      busqProd.value = "";
    };

<<<<<<< HEAD
    const agregarServicio = () => {
      if (!descServicio.value.trim() || precioServicio.value === null || precioServicio.value <= 0) return;
      servicios.value.push({
=======
  const agregarServicio = (s: ServicioDisponible) => {
    setServicios((prev) => [
      ...prev,
      {
>>>>>>> 84ac276 (Conecta frontend con inventario y facturacion)
        id: servicioId++,
        descripcion: descServicio.value.trim(),
        total: Number(precioServicio.value),
      });
      descServicio.value = "";
      precioServicio.value = null;
    };

    const actualizarLinea = (id: number, campo: keyof LineaProducto, valor: any) => {
      const idx = lineas.value.findIndex(l => l.id === id);
      if (idx !== -1) (lineas.value[idx] as any)[campo] = valor;
    };

    const eliminarLinea = (id: number) => {
      lineas.value = lineas.value.filter(l => l.id !== id);
    };

    const eliminarServicio = (id: number) => {
      servicios.value = servicios.value.filter(s => s.id !== id);
    };

    const generando = ref(false);

    const limpiarFormulario = () => {
      clienteId.value = "";
      sucursalId.value = "";
      lineas.value = [];
      servicios.value = [];
      descServicio.value = "";
      precioServicio.value = null;
      tipoPago.value = "contado";
    };

    const handleGenerarFactura = async () => {
      if (!sucursalId.value) {
        alert("Por favor, seleccione una sucursal.");
        return;
      }
      if (!clienteId.value) {
        alert("Por favor, seleccione un cliente.");
        return;
      }
      if (lineas.value.length === 0 && servicios.value.length === 0) {
        alert("Por favor, agregue al menos un producto o servicio.");
        return;
      }

      generando.value = true;
      try {
        const payload: Record<string, any> = {
          sucursal_id: sucursalId.value,
          cliente_id: clienteId.value,
          autor_id: getUserIdFromToken(),
          productos: lineas.value.map(l => ({
            producto_id: l.producto_id,
            cantidad: l.cantidad
          })),
          servicios: servicios.value.map(s => ({
            descripcion: s.descripcion,
            total: s.total
          }))
        };
        if (clienteSeleccionado.value?.rtn) {
          payload.rtn_cliente = clienteSeleccionado.value.rtn;
        }

        const res = await generateFactura(payload);
        const facturaId = res?.id;

        if (facturaId) {
          const html = await exportFactura(facturaId);
          const newWindow = window.open();
          if (newWindow) {
            newWindow.document.write(html);
            newWindow.document.close();
          } else {
            alert("Factura generada con éxito, pero la ventana emergente fue bloqueada. Por favor, permita los pop-ups.");
          }
          limpiarFormulario();
        } else {
          alert("Error: No se recibió el ID de la factura generada.");
        }
      } catch (err: any) {
        console.error("Error al generar factura:", err);
        alert(`Ocurrió un error al generar la factura: ${err.message || err}`);
      } finally {
        generando.value = false;
      }
    };

    const sucursalSeleccionada = computed(() => 
      sucursales.value.find((s) => s.id === sucursalId.value)
    );

    const t = computed(() => {
      let subtotal = 0, descuentos = 0, exento = 0, exonerado = 0, isv15 = 0, subtotalServicios = 0;

      // Productos
      lineas.value.forEach((l) => {
        const bruto = l.cantidad * l.precio;
        const desc = bruto * (l.descuento / 100);
        const neto = bruto - desc;
        subtotal += bruto;
        descuentos += desc;
        if (l.exento) exento += neto;
        else if (l.exonerado) exonerado += neto;
        else isv15 += neto * ISV15;
      });

      // Servicios y mano de obra (no gravados con ISV)
      servicios.value.forEach((s) => {
        subtotalServicios += s.total;
      });

      subtotal += subtotalServicios;
      const total = subtotal - descuentos + isv15;
      return { subtotal, subtotalServicios, descuentos, exento, exonerado, isv15, total };
    });

    const fmt = (n: number | undefined | null) => {
      if (n === undefined || n === null || Number.isNaN(n)) return 'L. 0.00';
      return `L. ${n.toLocaleString("es-HN", { minimumFractionDigits: 2 })}`;
    };

    const filtProd = computed(() => {
      const q = busqProd.value.toLowerCase();
      if (!q) return [];
      return productos.value.filter((p) => 
        p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q)
      ).slice(0, 5);
    });

<<<<<<< HEAD
    const clienteSeleccionado = computed(() => 
      clientes.value.find((c) => c.id === clienteId.value)
    );
=======
    subtotal += subtotalServicios;
    const total = subtotal - descuentos + isv15;
    return { subtotal, subtotalServicios, descuentos, exento, exonerado, isv15, total };
  };

  const getTotales = calcTotales;
  const fmt = (n: number) => `L. ${n.toLocaleString("es-HN", { minimumFractionDigits: 2 })}`;

  const precioNumero = (value: string | number) => {
    if (typeof value === 'number') return value;
    const parsed = Number(value.replace(/[^0-9.]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const cargarDatosFacturacion = async () => {
    cargandoDatos.value = true;
    errorFactura.value = '';
    try {
      const [productos, serviciosCatalogo, clientes] = await Promise.all([
        getProducts(),
        getServicios(),
        getClients(),
      ]);

      clientesDisponibles.value = clientes
        .filter((c) => c.activo)
        .map((c) => ({ id: c.id, nombre: c.nombre, rtn: c.rtn }));

      serviciosDisponibles.value = serviciosCatalogo.map((s) => ({
        id: s.id,
        descripcion: s.descripcion,
        precio: s.precio,
        categoria: s.categoria,
        notas: s.notas,
      }));

      productosDisponibles.value = await Promise.all(
        productos
          .filter((p) => p.activo)
          .map(async (p) => {
            let stock = 0;
            try {
              const inventario = await getInventario(sucursalId.value, p.id);
              stock = inventario.cantidad;
            } catch (err) {
              if (!(err instanceof ApiError && err.status === 404)) throw err;
            }

            return {
              id: p.id,
              nombre: p.nombre,
              precio: precioNumero(p.precio),
              stock,
              codigo: p.codigo,
              tipo: p.tipo_producto?.tipo,
              proveedor: p.proveedor?.nombre ?? undefined,
            };
          }),
      );
    } catch (err) {
      errorFactura.value = err instanceof Error ? err.message : 'No se pudieron cargar productos, servicios y clientes.';
    } finally {
      cargandoDatos.value = false;
    }
  };

  const autorId = () => (/^\d+$/.test(props.usuario.id) ? props.usuario.id : '1');

  const guardarFactura = async () => {
    if (lineas.value.length === 0 && servicios.value.length === 0) {
      errorFactura.value = 'Agrega al menos un producto o servicio para facturar.';
      return;
    }

    guardandoFactura.value = true;
    errorFactura.value = '';
    mensajeFactura.value = '';
    try {
      const factura = await generateFactura({
        sucursal_id: sucursalId.value,
        autor_id: autorId(),
        cliente_id: cliente.value || undefined,
        rtn_cliente: clienteSeleccionado.value?.rtn ?? undefined,
        productos: lineas.value.map((l) => ({
          producto_id: l.codigo,
          cantidad: Number(l.cantidad) || 1,
        })),
        servicios: servicios.value.map((s) => ({
          descripcion: `${s.descripcion}${s.cantidad > 1 ? ` x${s.cantidad}` : ''}`,
          total: Number((s.cantidad * s.precio * (1 - s.descuento / 100)).toFixed(2)),
          nota_interna: s.codigo,
        })),
      });

      mensajeFactura.value = `Factura ${factura.numero_factura ?? ''} generada correctamente.`;
      setLineas([]);
      setServicios([]);
      setVistaPrevia(false);
      await cargarDatosFacturacion();
    } catch (err) {
      errorFactura.value = err instanceof Error ? err.message : 'No se pudo generar la factura.';
    } finally {
      guardandoFactura.value = false;
    }
  };

  const filtProd = computed(() =>
    productosDisponibles.value.filter((p) => {
      const term = busqProd.value.toLowerCase();
      return term.length > 0
        && p.stock > 0
        && [p.nombre, p.codigo, p.tipo, p.proveedor].some((value) => value?.toLowerCase().includes(term));
    }),
  );

  const filtServ = computed(() =>
    serviciosDisponibles.value.filter(
      (s) => s.descripcion.toLowerCase().includes(busqServ.value.toLowerCase()) && busqServ.value.length > 0,
    ),
  );

  const clienteSeleccionado = computed(() => clientesDisponibles.value.find((c) => c.id === cliente.value));

  onMounted(cargarDatosFacturacion);
>>>>>>> 84ac276 (Conecta frontend con inventario y facturacion)

    return () => {
      const cai = getCaiSucursal(sucursalId.value);
      const sucursalActiva = getSucursalActiva(sucursalId.value);
      const totalRango = Math.max(secuencial(cai.rangoFin) - secuencial(cai.rangoInicio) + 1, 1);
      const usados = Math.max(secuencial(cai.facturaActual) - secuencial(cai.rangoInicio) + 1, 0);
      const restantes = Math.max(totalRango - usados, 0);
      const t = getTotales();
      const accionBloqueada = guardandoFactura.value || cargandoDatos.value;
      return (
    <div class="space-y-5">
      {(errorFactura.value || mensajeFactura.value || cargandoDatos.value) && (
        <div
          class="rounded-xl px-4 py-3 text-sm font-semibold"
          style={{
            background: errorFactura.value ? '#FEF2F2' : mensajeFactura.value ? '#F0FDF4' : '#EFF6FF',
            color: errorFactura.value ? '#B91C1C' : mensajeFactura.value ? '#15803D' : '#1D4ED8',
            border: `1px solid ${errorFactura.value ? '#FECACA' : mensajeFactura.value ? '#BBF7D0' : '#BFDBFE'}`,
          }}
        >
          {errorFactura.value || mensajeFactura.value || 'Cargando productos, servicios y clientes...'}
        </div>
      )}
      {/* === BLOQUE CAI FISCAL === */}
<<<<<<< HEAD
=======
      <div
        class="rounded-2xl overflow-hidden shadow-md"
        style={{ border: "1px solid #1E3A5F" }}
      >
        {/* Encabezado fiscal */}
        <div
          class="flex items-center justify-between px-6 py-4"
          style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)" }}
        >
          <div class="flex items-center gap-3">
            <div
              class="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(56,189,248,0.18)", border: "1px solid rgba(56,189,248,0.30)" }}
            >
              <ShieldCheck size={18} style={{ color: "#38BDF8" }} />
            </div>
            <div>
              <div class="font-bold text-sm" style={{ color: "#fff" }}>
                Datos Fiscales — CAI
              </div>
              <div class="text-xs" style={{ color: "#7DD3FC" }}>
                Sucursal emisora, condición de pago y avance del rango autorizado
              </div>
            </div>
          </div>
        </div>

        {/* Sucursal, pago y avance CAI */}
        <div
          class="px-6 py-5"
          style={{ background: "#F8FBFF", borderTop: "1px solid #DBEAFE" }}
        >
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="col-span-2">
              <label class="block text-xs font-bold mb-1.5" style={{ color: "#1E3A5F" }}>
                Escoger sucursal
              </label>
              <div class="relative">
                <select
                  value={sucursalId.value}
                  disabled={props.usuario.rol !== 'admin'}
                  onChange={(e) => setSucursalId((e.target as HTMLSelectElement).value)}
                  class="w-full px-3 py-2.5 rounded-xl text-xs outline-none appearance-none"
                  style={{ background: props.usuario.rol === 'admin' ? "#fff" : "#EFF6FF", border: "1px solid #BFDBFE", color: "#1E3A5F", cursor: props.usuario.rol === 'admin' ? 'pointer' : 'not-allowed' }}
                >
                  {store.sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
                <ChevronDown size={12} class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#64748B" }} />
              </div>
            </div>

            {/* Tipo de compra */}
            <div class="col-span-2">
              <label class="block text-xs font-bold mb-2" style={{ color: "#1E3A5F" }}>
                Tipo de compra
              </label>
              <div class="flex gap-3">
                {(["contado", "credito"] as const).map((tipo) => (
                  <label
                    key={tipo}
                    class="flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-all"
                    style={{
                      background: tipoPago.value === tipo ? "linear-gradient(135deg,#0F172A,#1E3A5F)" : "#fff",
                      border: `1px solid ${tipoPago.value === tipo ? "#38BDF8" : "#BFDBFE"}`,
                    }}
                  >
                    <input
                      type="radio"
                      name="tipoPago.value"
                      value={tipo}
                      checked={tipoPago.value === tipo}
                      onChange={() => setTipoPago(tipo)}
                      class="hidden"
                    />
                    <div
                      class="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                      style={{ borderColor: tipoPago.value === tipo ? "#38BDF8" : "#CBD5E1" }}
                    >
                      {tipoPago.value === tipo && (
                        <div class="w-2 h-2 rounded-full" style={{ background: "#38BDF8" }} />
                      )}
                    </div>
                    {tipo === "contado" ? (
                      <Banknote size={13} style={{ color: tipoPago.value === tipo ? "#38BDF8" : "#64748B" }} />
                    ) : (
                      <CreditCard size={13} style={{ color: tipoPago.value === tipo ? "#38BDF8" : "#64748B" }} />
                    )}
                    <span
                      class="text-xs font-semibold capitalize"
                      style={{ color: tipoPago.value === tipo ? "#fff" : "#374151" }}
                    >
                      {tipo === "contado" ? "Contado" : "Crédito"}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* ── Indicador de uso del rango ── */}
            <div
              class="col-span-2 lg:col-span-4 rounded-xl p-4"
              style={{
                background: restantes <= 5 ? "#FEF2F2" : restantes <= 15 ? "#FFF7ED" : "#F0F9FF",
                border: `1px solid ${restantes <= 5 ? "#FECACA" : restantes <= 15 ? "#FED7AA" : "#BAE6FD"}`,
              }}
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <ShieldCheck size={13} style={{ color: restantes <= 5 ? "#F87171" : restantes <= 15 ? "#FB923C" : "#38BDF8" }} />
                  <span class="text-xs font-bold" style={{ color: restantes <= 5 ? "#DC2626" : restantes <= 15 ? "#C2410C" : "#0369A1" }}>
                    CAI usados en esta sucursal
                  </span>
                </div>
                <span class="text-xs font-bold" style={{ color: restantes <= 5 ? "#DC2626" : restantes <= 15 ? "#C2410C" : "#0369A1" }}>
                  {usados} / {totalRango} facturas usadas · {restantes} restantes
                </span>
              </div>
              <div class="h-2 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.08)" }}>
                <div
                  class="h-full rounded-full transition-all"
                  style={{
                    width: `${(usados / totalRango) * 100}%`,
                    background: restantes <= 5
                      ? "linear-gradient(90deg,#F87171,#EF4444)"
                      : restantes <= 15
                      ? "linear-gradient(90deg,#FB923C,#F97316)"
                      : "linear-gradient(90deg,#38BDF8,#0EA5E9)",
                  }}
                />
              </div>
              {restantes <= 15 && (
                <p class="text-xs mt-2" style={{ color: restantes <= 5 ? "#DC2626" : "#C2410C" }}>
                  {restantes <= 5
                    ? "⚠️ Rango casi agotado. Ve a Configuración → Configuración fiscal para solicitar y registrar un nuevo CAI."
                    : `Quedan ${restantes} facturas en este rango. Solicita un nuevo CAI a la SAR pronto.`}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
>>>>>>> 84ac276 (Conecta frontend con inventario y facturacion)

      <div class="grid lg:grid-cols-3 gap-6">
        {/* Panel izquierdo */}
        <div class="lg:col-span-2 space-y-5">
          {/* Cliente */}
          <div
            class="rounded-2xl p-6 shadow-sm"
            style={{ background: "#fff", border: "1px solid rgba(15,23,42,0.06)" }}
          >
            <h3
              class="font-bold mb-4 flex items-center gap-2"
              style={{ color: "#0F172A" }}
            >
              <div
                class="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#38BDF8,#818CF8)" }}
              >
                <User size={14} style={{ color: "#fff" }} />
              </div>
              Datos del cliente
            </h3>
            <div class="grid grid-cols-2 gap-4">
              <div class="col-span-2">
                <label
                  class="block text-xs font-semibold mb-1.5"
                  style={{ color: "#374151" }}
                >
                  Seleccionar cliente
                </label>
                <div class="relative">
                  <select
                    value={clienteId.value}
                    onChange={(e) => (clienteId.value = (e.target as HTMLInputElement).value)}
                    class="w-full px-3 py-2.5 rounded-xl text-sm outline-none appearance-none"
                    style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#374151" }}
                  >
<<<<<<< HEAD
                    <option value="">— {loadingClientes.value ? 'Cargando clientes...' : 'Cliente de contado / Seleccionar'} —</option>
                    {clientes.value.filter(c => !!c).map((c) => (
=======
                    <option value="">— Cliente de contado / Seleccionar —</option>
                    {clientesDisponibles.value.map((c) => (
>>>>>>> 84ac276 (Conecta frontend con inventario y facturacion)
                      <option key={c.id} value={c.id}>
                        {c.nombre} · RTN: {c.rtn}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: "#94A3B8" }}
                  />
                </div>
              </div>
              <div>
                <label
                  class="block text-xs font-semibold mb-1.5"
                  style={{ color: "#374151" }}
                >
                  RTN del cliente
                </label>
                <input
<<<<<<< HEAD
                  value={clienteSeleccionado.value?.rtn ?? ""}
                  readOnly
                  placeholder="0000-0000-00000"
=======
                  placeholder={clienteSeleccionado.value?.rtn ?? "0000-0000-00000"}
                  value={clienteSeleccionado.value?.rtn ?? ""}
                  readonly
>>>>>>> 84ac276 (Conecta frontend con inventario y facturacion)
                  class="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#64748B" }}
                />
              </div>
              <div>
                <label
                  class="block text-xs font-semibold mb-1.5"
                  style={{ color: "#374151" }}
                >
                  Sucursal de venta
                </label>

                <div class="relative">
                  <select
                    value={sucursalId.value}
                    onChange={(e) => (sucursalId.value = (e.target as HTMLInputElement).value)}
                    class="w-full px-3 py-2.5 rounded-xl text-sm outline-none appearance-none"
                    style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#374151" }}
                  >
                    <option value="">Seleccionar sucursal</option>
                    {sucursales.value.map((s) => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: "#94A3B8" }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Productos */}
          <div
            class="rounded-2xl p-6 shadow-sm"
            style={{ background: "#fff", border: "1px solid rgba(15,23,42,0.06)" }}
          >
            <h3
              class="font-bold mb-4 flex items-center gap-2"
              style={{ color: "#0F172A" }}
            >
              <div
                class="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#38BDF8,#0EA5E9)" }}
              >
                <Package size={14} style={{ color: "#fff" }} />
              </div>
              Detalle de productos
            </h3>

            {/* Buscador */}
            <div class="relative mb-4">
              <Search
                size={15}
                class="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "#94A3B8" }}
              />
              <input
                value={busqProd.value}
                onInput={(e) => (busqProd.value = (e.target as HTMLInputElement).value)}
                placeholder={loadingProds.value ? "Cargando catálogo..." : "Buscar por nombre o código..."}
                class="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#111827" }}
              />
              {filtProd.value.length > 0 && (
                <div
                  class="absolute left-0 right-0 top-full mt-1 rounded-xl shadow-xl z-20 overflow-hidden"
                  style={{ background: "#fff", border: "1px solid #E2E8F0" }}
                >
                  {filtProd.value.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => agregarProducto(p)}
                      class="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-50 text-left transition-colors"
                    >
                      <div>
                        <div class="font-semibold" style={{ color: "#0F172A" }}>
                          {p.nombre}
                        </div>
                        <div class="text-xs" style={{ color: "#94A3B8" }}>
<<<<<<< HEAD
                          {p.codigo}
=======
                          {p.codigo ?? p.id} · {p.tipo ?? "Sin tipo"}{p.proveedor ? ` · ${p.proveedor}` : ""}
>>>>>>> 84ac276 (Conecta frontend con inventario y facturacion)
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="font-semibold text-xs" style={{ color: "#15803D" }}>
                          Stock {p.stock}
                        </span>
                        <span class="font-bold text-xs" style={{ color: "#38BDF8" }}>
                          {formatPrecio(p.precio)}
                        </span>
                        <Plus size={14} style={{ color: "#64748B" }} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tabla de líneas */}
            {lineas.value.length === 0 ? (
              <div
                class="flex flex-col items-center justify-center py-12 rounded-xl"
                style={{ background: "#F8FAFC", border: "1px dashed #E2E8F0" }}
              >
                <Package size={32} style={{ color: "#CBD5E1" }} />
                <p class="text-sm mt-2 font-semibold" style={{ color: "#94A3B8" }}>
                  Sin productos agregados
                </p>
                <p class="text-xs mt-1" style={{ color: "#CBD5E1" }}>
                  Busca y selecciona productos arriba
                </p>
              </div>
            ) : (
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                      {["Producto", "Cant.", "Precio unit.", "Desc. %", "Exento", "Total", ""].map(
                        (h) => (
                          <th
                            key={h}
                            class="text-left pb-2 pr-4 text-xs font-semibold"
                            style={{ color: "#64748B" }}
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {lineas.value.map((l) => {
                      const bruto = l.cantidad * l.precio;
                      const neto = bruto * (1 - l.descuento / 100);
                      return (
                        <tr key={l.id} style={{ borderBottom: "1px solid #F8FAFC" }}>
                          <td class="py-2.5 pr-4">
                            <div
                              class="font-semibold text-xs"
                              style={{ color: "#0F172A" }}
                            >
                              {l.nombre}
                            </div>
                            <div class="text-xs" style={{ color: "#94A3B8" }}>
                              {l.codigo}
                            </div>
                          </td>
                          <td class="py-2.5 pr-4">
                            <input
                              type="number"
                              min={1}
                              value={l.cantidad}
                              onChange={(e) =>
                                actualizarLinea(l.id, "cantidad", Number((e.target as HTMLInputElement).value))
                              }
                              class="w-16 px-2 py-1.5 rounded-lg text-xs text-center outline-none"
                              style={{
                                background: "#F8FAFC",
                                border: "1px solid #E2E8F0",
                                color: "#111827",
                              }}
                            />
                          </td>
                          <td
                            class="py-2.5 pr-4 text-xs font-semibold"
                            style={{ color: "#374151" }}
                          >
                            {fmt(l.precio)}
                          </td>
                          <td class="py-2.5 pr-4">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={l.descuento}
                              onChange={(e) =>
                                actualizarLinea(l.id, "descuento", Number((e.target as HTMLInputElement).value))
                              }
                              class="w-16 px-2 py-1.5 rounded-lg text-xs text-center outline-none"
                              style={{
                                background: "#F8FAFC",
                                border: "1px solid #E2E8F0",
                                color: "#111827",
                              }}
                            />
                          </td>
                          <td class="py-2.5 pr-4">
                            <input
                              type="checkbox"
                              checked={l.exento}
                              onChange={(e) => actualizarLinea(l.id, "exento", (e.target as HTMLInputElement).checked)}
                              class="rounded"
                            />
                          </td>
                          <td
                            class="py-2.5 pr-4 text-xs font-bold"
                            style={{ color: "#0F172A" }}
                          >
                            {fmt(neto)}
                          </td>
                          <td class="py-2.5">
                            <button
                              onClick={() => eliminarLinea(l.id)}
                              class="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-red-50"
                            >
                              <Trash2 size={12} style={{ color: "#F87171" }} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Servicios y mano de obra */}
          <div
            class="rounded-2xl p-6 shadow-sm"
            style={{ background: "#fff", border: "1px solid rgba(15,23,42,0.06)" }}
          >
            <h3
              class="font-bold mb-4 flex items-center gap-2"
              style={{ color: "#0F172A" }}
            >
              <div
                class="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#FDBA74,#FB923C)" }}
              >
                <Wrench size={14} style={{ color: "#fff" }} />
              </div>
              Servicios y mano de obra
            </h3>

<<<<<<< HEAD
            {/* Formulario de agregar servicio */}
            <div class="grid grid-cols-1 md:grid-cols-12 gap-3 mb-5 p-4 rounded-xl" style={{ background: "#FFF7ED", border: "1px solid #FDBA74" }}>
              <div class="md:col-span-7">
                <label class="block text-xs font-semibold mb-1.5" style={{ color: "#C2410C" }}>
                  Descripción del servicio
                </label>
                <input
                  value={descServicio.value}
                  onInput={(e) => (descServicio.value = (e.target as HTMLInputElement).value)}
                  placeholder="Ej. Cambio de bujías, Alineación..."
                  class="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: "#fff", border: "1px solid #FDBA74", color: "#111827" }}
                />
              </div>
              <div class="md:col-span-3">
                <label class="block text-xs font-semibold mb-1.5" style={{ color: "#C2410C" }}>
                  Precio (L.)
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={precioServicio.value === null ? "" : precioServicio.value}
                  onInput={(e) => (precioServicio.value = (e.target as HTMLInputElement).value === "" ? null : Number((e.target as HTMLInputElement).value))}
                  placeholder="0.00"
                  class="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: "#fff", border: "1px solid #FDBA74", color: "#111827" }}
                />
              </div>
              <div class="md:col-span-2 flex items-end">
                <button
                  onClick={agregarServicio}
                  class="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-all shadow-sm animate-pulse-subtle"
                  style={{
                    background: "linear-gradient(135deg, #FB923C, #F97316)",
                    color: "#fff",
                    boxShadow: "0 2px 6px rgba(249,115,22,0.2)",
                  }}
                >
                  <Plus size={16} /> Agregar
                </button>
              </div>
=======
            {/* Buscador de servicios */}
            <div class="relative mb-4">
              <Search
                size={15}
                class="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "#94A3B8" }}
              />
              <input
                value={busqServ.value}
                onChange={(e) => setBusqServ((e.target as HTMLInputElement).value)}
                placeholder="Buscar y agregar servicio o mano de obra..."
                class="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#111827" }}
              />
              {filtServ.value.length > 0 && (
                <div
                  class="absolute left-0 right-0 top-full mt-1 rounded-xl shadow-xl z-20 overflow-hidden"
                  style={{ background: "#fff", border: "1px solid #E2E8F0" }}
                >
                  {filtServ.value.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => agregarServicio(s)}
                      class="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-50 text-left transition-colors"
                    >
                      <div>
                        <div class="font-semibold" style={{ color: "#0F172A" }}>
                          {s.descripcion}
                        </div>
                        <div class="text-xs" style={{ color: "#94A3B8" }}>
                          {s.id}
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-xs" style={{ color: "#FB923C" }}>
                          {fmt(s.precio)}
                        </span>
                        <Plus size={14} style={{ color: "#64748B" }} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
>>>>>>> 84ac276 (Conecta frontend con inventario y facturacion)
            </div>

            {/* Tabla de servicios */}
            {servicios.value.length === 0 ? (
              <div
                class="flex flex-col items-center justify-center py-12 rounded-xl"
                style={{ background: "#FFF7ED", border: "1px dashed #FDBA74" }}
              >
                <Wrench size={32} style={{ color: "#FB923C" }} />
                <p class="text-sm mt-2 font-semibold" style={{ color: "#C2410C" }}>
                  Sin servicios agregados
                </p>
                <p class="text-xs mt-1" style={{ color: "#FDBA74" }}>
                  Ingresa la descripción y el precio arriba para agregar un servicio
                </p>
              </div>
            ) : (
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                      {["Servicio", "Total", ""].map(
                        (h) => (
                          <th
                            key={h}
                            class="text-left pb-2 pr-4 text-xs font-semibold"
                            style={{ color: "#64748B" }}
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {servicios.value.map((s) => {
                      return (
                        <tr key={s.id} style={{ borderBottom: "1px solid #F8FAFC" }}>
                          <td class="py-2.5 pr-4">
                            <div
                              class="font-semibold text-xs"
                              style={{ color: "#0F172A" }}
                            >
                              {s.descripcion}
                            </div>
                          </td>
                          <td
                            class="py-2.5 pr-4 text-xs font-bold"
                            style={{ color: "#C2410C" }}
                          >
                            {fmt(s.total)}
                          </td>
                          <td class="py-2.5">
                            <button
                              onClick={() => eliminarServicio(s.id)}
                              class="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-red-50"
                            >
                              <Trash2 size={12} style={{ color: "#F87171" }} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Panel derecho — resumen */}
        <div class="space-y-4">
          <div
            class="rounded-2xl p-6 shadow-sm"
            style={{ background: "#fff", border: "1px solid rgba(15,23,42,0.06)" }}
          >
            <h3
              class="font-bold mb-5 flex items-center gap-2"
              style={{ color: "#0F172A" }}
            >
              <FileText size={16} style={{ color: "#FDBA74" }} /> Resumen de factura
            </h3>
            <div class="space-y-2">
              {[
                { label: "Subtotal productos", value: fmt(t.value.subtotal - t.value.subtotalServicios), color: "#374151", show: lineas.value.length > 0 },
                { label: "Subtotal servicios", value: fmt(t.value.subtotalServicios), color: "#FB923C", show: servicios.value.length > 0 },
                { label: "Descuentos y rebajas", value: `- ${fmt(t.value.descuentos)}`, color: "#F87171", show: t.value.descuentos > 0 },
                { label: "Importe exento", value: fmt(t.value.exento), color: "#374151", show: t.value.exento > 0 },
                { label: "Importe exonerado", value: fmt(t.value.exonerado), color: "#374151", show: t.value.exonerado > 0 },
                { label: "ISV 15%", value: fmt(t.value.isv15), color: "#374151", show: true },
              ]
                .filter((row) => row.show)
                .map((row) => (
                  <div
                    key={row.label}
                    class="flex items-center justify-between py-1.5"
                    style={{ borderBottom: "1px solid #F8FAFC" }}
                  >
                    <span class="text-xs" style={{ color: "#64748B" }}>
                      {row.label}
                    </span>
                    <span class="text-xs font-semibold" style={{ color: row.color }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              <div
                class="flex items-center justify-between pt-3 mt-1"
                style={{ borderTop: "2px solid #E2E8F0" }}
              >
                <span class="font-bold" style={{ color: "#0F172A" }}>
                  Total a pagar
                </span>
                <span class="text-xl font-extrabold" style={{ color: "#F87171" }}>
                  {fmt(t.value.total)}
                </span>
              </div>
            </div>
            <div class="mt-5 space-y-3">
              <div>
                <label
                  class="block text-xs font-semibold mb-1.5"
                  style={{ color: "#374151" }}
                >
                  Forma de pago
                </label>
                <select
                  value={tipoPago.value}
                  onChange={(e) => (tipoPago.value = (e.target as HTMLInputElement).value as any)}
                  class="w-full px-3 py-2.5 rounded-xl text-sm outline-none appearance-none"
                  style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#374151" }}
                >
                  <option value="contado">Efectivo</option>
                  <option value="contado">Tarjeta de crédito</option>
                  <option value="contado">Transferencia bancaria</option>
                  <option value="credito">Crédito interno</option>
                </select>
              </div>
              <div>
                <label
                  class="block text-xs font-semibold mb-1.5"
                  style={{ color: "#374151" }}
                >
                  Observaciones
                </label>
                <textarea
                  rows={2}
                  placeholder="Notas adicionales..."
                  class="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
                  style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#111827" }}
                />
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div class="space-y-2.5">
            <button
<<<<<<< HEAD
              onClick={handleGenerarFactura}
              disabled={generando.value}
=======
              onClick={guardarFactura}
              disabled={accionBloqueada}
>>>>>>> 84ac276 (Conecta frontend con inventario y facturacion)
              class="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all shadow-md"
              style={{
                background: generando.value
                  ? "#94A3B8"
                  : "linear-gradient(135deg, #0F172A, #1E3A5F)",
                color: "#fff",
<<<<<<< HEAD
                boxShadow: generando.value ? "none" : "0 4px 14px rgba(15,23,42,0.30)",
                cursor: generando.value ? "not-allowed" : "pointer",
              }}
            >
              {generando.value ? (
                <>
                  <Loader2 class="animate-spin" size={15} /> Generando...
                </>
              ) : (
                <>
                  <FileText size={15} /> Generar factura
                </>
              )}
            </button>
            <button
              onClick={limpiarFormulario}
              disabled={generando.value}
=======
                opacity: accionBloqueada ? 0.65 : 1,
                boxShadow: "0 4px 14px rgba(248,113,113,0.35)",
              }}
            >
              <Save size={15} /> {guardandoFactura.value ? "Guardando..." : "Guardar venta"}
            </button>
            <button
              onClick={guardarFactura}
              disabled={accionBloqueada}
              class="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all shadow-md"
              style={{
                background: "linear-gradient(135deg, #0F172A, #1E3A5F)",
                color: "#fff",
                opacity: accionBloqueada ? 0.65 : 1,
                boxShadow: "0 4px 14px rgba(15,23,42,0.30)",
              }}
            >
              <FileText size={15} /> {guardandoFactura.value ? "Generando..." : "Generar factura"}
            </button>
            <div class="grid grid-cols-2 gap-2">
              <button
                onClick={() => setVistaPrevia(!vistaPrevia.value)}
                class="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: "#EFF6FF",
                  color: "#1D4ED8",
                  border: "1px solid #BFDBFE",
                }}
              >
                <Eye size={14} /> Vista previa
              </button>
              <button
                class="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: "#F8FAFC",
                  color: "#374151",
                  border: "1px solid #E2E8F0",
                }}
              >
                <Printer size={14} /> Imprimir
              </button>
            </div>
            <button
>>>>>>> 84ac276 (Conecta frontend con inventario y facturacion)
              class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: "#FEF2F2",
                color: "#B91C1C",
                border: "1px solid #FECACA",
              }}
            >
              <X size={14} /> Cancelar
            </button>
          </div>
<<<<<<< HEAD
=======

          {/* Vista previa de factura */}
          {vistaPrevia.value && (
            <div
              class="rounded-2xl overflow-hidden shadow-sm"
              style={{ border: "1px solid #E2E8F0" }}
            >
              {/* Header factura */}
              <div
                class="px-5 py-4 text-center"
                style={{ background: "linear-gradient(135deg, #0F172A, #1E3A5F)" }}
              >
                <div class="font-bold text-base" style={{ color: "#fff" }}>
                  Turbo Auto F&M 504
                </div>
                <div class="text-xs mt-0.5" style={{ color: "#7DD3FC" }}>
                  RTN: {cai.rtn}
                </div>
                <div
                  class="text-xs font-extrabold mt-1 tracking-widest"
                  style={{ color: "#38BDF8" }}
                >
                  FACTURA FISCAL
                </div>
                <div class="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
                  No.: {cai.facturaActual}
                </div>
              </div>

              {/* Datos CAI en previa */}
              <div
                class="px-5 py-3"
                style={{ background: "#EFF6FF", borderBottom: "1px dashed #BFDBFE" }}
              >
                <p class="text-xs font-bold mb-1" style={{ color: "#1E3A5F" }}>
                  Datos fiscales — CAI
                </p>
                <p class="text-xs font-mono break-all" style={{ color: "#1D4ED8" }}>
                  {cai.numero}
                </p>
                <div class="flex gap-4 mt-1">
                  <span class="text-xs" style={{ color: "#64748B" }}>
                    Desde: <span class="font-mono" style={{ color: "#0369A1" }}>{cai.rangoInicio}</span>
                  </span>
                  <span class="text-xs" style={{ color: "#64748B" }}>
                    Hasta: <span class="font-mono" style={{ color: "#0369A1" }}>{cai.rangoFin}</span>
                  </span>
                </div>
                <p class="text-xs mt-1" style={{ color: "#64748B" }}>
                  Límite de emisión:{" "}
                  <span class="font-semibold" style={{ color: "#0369A1" }}>
                    {cai.fechaLimite}
                  </span>{" "}
                  · Sucursal:{" "}
                  <span class="font-semibold" style={{ color: "#0369A1" }}>
                    {sucursalActiva?.nombre ?? 'Sin sucursal'}
                  </span>
                </p>
              </div>

              <div class="px-5 py-4" style={{ background: "#fff" }}>
                <div class="space-y-1 text-xs mb-3">
                  <div class="flex justify-between">
                    <span style={{ color: "#64748B" }}>Fecha:</span>
                    <span style={{ color: "#374151" }}>01/06/2024</span>
                  </div>
                  <div class="flex justify-between">
                    <span style={{ color: "#64748B" }}>Cliente:</span>
                    <span style={{ color: "#374151" }}>
                      {clienteSeleccionado.value?.nombre ?? "Contado"}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span style={{ color: "#64748B" }}>Tipo:</span>
                    <span
                      class="font-semibold capitalize"
                      style={{
                        color: tipoPago.value === "contado" ? "#15803D" : "#C2410C",
                      }}
                    >
                      {tipoPago.value}
                    </span>
                  </div>
                </div>

                {/* Productos */}
                {lineas.value.length > 0 && (
                  <>
                    <p class="text-xs font-bold mb-1.5 mt-3" style={{ color: "#0F172A" }}>
                      Productos
                    </p>
                    {lineas.value.map((l) => (
                      <div
                        key={l.id}
                        class="flex justify-between text-xs py-1"
                        style={{ borderBottom: "1px solid #F8FAFC" }}
                      >
                        <span style={{ color: "#374151" }}>
                          {l.nombre} x{l.cantidad}
                        </span>
                        <span style={{ color: "#0F172A", fontWeight: 600 }}>
                          {fmt(l.cantidad * l.precio * (1 - l.descuento / 100))}
                        </span>
                      </div>
                    ))}
                  </>
                )}

                {/* Servicios */}
                {servicios.value.length > 0 && (
                  <>
                    <p class="text-xs font-bold mb-1.5 mt-3 flex items-center gap-1.5" style={{ color: "#C2410C" }}>
                      <Wrench size={12} /> Servicios y mano de obra
                    </p>
                    {servicios.value.map((s) => (
                      <div
                        key={s.id}
                        class="flex justify-between text-xs py-1"
                        style={{ borderBottom: "1px solid #FFF7ED" }}
                      >
                        <span style={{ color: "#374151" }}>
                          {s.descripcion} x{s.cantidad}
                        </span>
                        <span style={{ color: "#C2410C", fontWeight: 600 }}>
                          {fmt(s.cantidad * s.precio * (1 - s.descuento / 100))}
                        </span>
                      </div>
                    ))}
                  </>
                )}

                <div
                  class="pt-3 mt-2 flex justify-between font-bold"
                  style={{ borderTop: "2px dashed #E2E8F0" }}
                >
                  <span style={{ color: "#0F172A" }}>TOTAL</span>
                  <span style={{ color: "#F87171" }}>{fmt(t.total)}</span>
                </div>
              </div>
            </div>
          )}
>>>>>>> 84ac276 (Conecta frontend con inventario y facturacion)
        </div>
      </div>
    </div>
  );
    };
  },
});

</script>
