<script lang="tsx">
import { defineComponent, ref, computed, onMounted } from 'vue';
import {
  Search, Plus, Trash2, FileText, Printer, Eye, ChevronDown,
  User, Package, ShieldCheck, Lock, Save, X,
  CreditCard, Banknote, Wrench, Loader2, AlertCircle
} from "lucide-vue-next";
import { useProductos, formatPrecio } from '../composables/useProductos';
import { useClientes } from '../composables/useClientes';
import { useSucursales } from '../composables/useSucursales';
import type { Product, Client, Sucursal } from '../api/schemas';
import { generateFactura, exportFactura, getUserIdFromToken } from '../api';

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

const CAI_PREDETERMINADO = {
  numero: "2F4A8B-C91E3D-7A2150-B4F839-DE6C02-A5",
  rangoInicio: "001-001-01-00000001",
  rangoFin:    "001-001-01-00000050",
  facturaActual: "001-001-01-00000038",
  fechaLimite: "2025-03-31",
  rtn: "0501-2015-00248",
};

// Extrae el número secuencial del formato 001-001-01-XXXXXXXX
function secuencial(correlativo: string): number {
  return parseInt(correlativo.split("-").at(-1) ?? "0", 10);
}

const totalRango = secuencial(CAI_PREDETERMINADO.rangoFin) - secuencial(CAI_PREDETERMINADO.rangoInicio) + 1; // 50
const usados = secuencial(CAI_PREDETERMINADO.facturaActual) - secuencial(CAI_PREDETERMINADO.rangoInicio) + 1; // 38
const restantes = totalRango - usados; // 12

let lineaId = 1;
let servicioId = 1;


export default defineComponent({
  name: 'NuevaVenta',
  
  
  setup() {
    const { productos, loading: loadingProds } = useProductos();
    const { clientes, load: loadClientes, loading: loadingClientes } = useClientes();
    const { sucursales, load: loadSucursales } = useSucursales();

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

    // Inputs for manually adding a service
    const descServicio = ref("");
    const precioServicio = ref<number | null>(null);

    const caiNumero = CAI_PREDETERMINADO.numero;
    const caiRangoInicio = CAI_PREDETERMINADO.rangoInicio;
    const caiRangoFin = CAI_PREDETERMINADO.rangoFin;
    const caiFactura = CAI_PREDETERMINADO.facturaActual;
    const caiFecha = CAI_PREDETERMINADO.fechaLimite;
    const caiRtn = CAI_PREDETERMINADO.rtn;

    const ISV15 = 0.15;

    const agregarProducto = (p: Product) => {
      lineas.value.push({
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

    const agregarServicio = () => {
      if (!descServicio.value.trim() || precioServicio.value === null || precioServicio.value <= 0) return;
      servicios.value.push({
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

    const clienteSeleccionado = computed(() => 
      clientes.value.find((c) => c.id === clienteId.value)
    );

    return () => {
      return (
    <div class="space-y-5">
      {/* === BLOQUE CAI FISCAL === */}

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
                    <option value="">— {loadingClientes.value ? 'Cargando clientes...' : 'Cliente de contado / Seleccionar'} —</option>
                    {clientes.value.filter(c => !!c).map((c) => (
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
                  value={clienteSeleccionado.value?.rtn ?? ""}
                  readOnly
                  placeholder="0000-0000-00000"
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
                          {p.codigo}
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
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
                              onChange={(e) => actualizarLinea(l.id, "exento", e.target.checked)}
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
              onClick={handleGenerarFactura}
              disabled={generando.value}
              class="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all shadow-md"
              style={{
                background: generando.value
                  ? "#94A3B8"
                  : "linear-gradient(135deg, #0F172A, #1E3A5F)",
                color: "#fff",
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
        </div>
      </div>
    </div>
  );
    };
  },
});

</script>