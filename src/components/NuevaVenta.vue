<script lang="tsx">
import { defineComponent, ref, type PropType } from 'vue';
import {
  Search, Plus, Trash2, FileText, Printer, Eye, ChevronDown,
  User, Package, ShieldCheck, Lock, Save, X,
  CreditCard, Banknote, Wrench,
} from "lucide-vue-next";

interface LineaProducto {
  id: number;
  nombre: string;
  codigo: string;
  cantidad: number;
  precio: number;
  descuento: number;
  exento: boolean;
  exonerado: boolean;
}

interface LineaServicio {
  id: number;
  descripcion: string;
  codigo: string;
  cantidad: number;
  precio: number;
  descuento: number;
}

const productosDisponibles = [
  { id: "PRD-001", nombre: "Filtro de aceite 5W-30", precio: 85 },
  { id: "PRD-002", nombre: "Pastillas freno Bosch DB1170", precio: 280 },
  { id: "PRD-003", nombre: "Bujías NGK Platinum BKR5E", precio: 95 },
  { id: "PRD-004", nombre: "Batería Willard 12V 60Ah", precio: 1250 },
  { id: "PRD-005", nombre: "Aceite Motor Castrol GTX 20W-50", precio: 185 },
  { id: "PRD-006", nombre: "Amortiguador Monroe 911264", precio: 950 },
];

const serviciosDisponibles = [
  { id: "SRV-001", descripcion: "Instalación de frenos completo", precio: 450 },
  { id: "SRV-002", descripcion: "Cambio de aceite y filtro", precio: 200 },
  { id: "SRV-003", descripcion: "Alineación y balanceo", precio: 350 },
  { id: "SRV-004", descripcion: "Diagnóstico electrónico", precio: 300 },
  { id: "SRV-005", descripcion: "Reparación de suspensión", precio: 800 },
  { id: "SRV-006", descripcion: "Instalación de batería", precio: 150 },
  { id: "SRV-007", descripcion: "Cambio de bujías", precio: 180 },
  { id: "SRV-008", descripcion: "Mano de obra general", precio: 250 },
];

const clientesDisponibles = [
  { id: "CLI-001", nombre: "Roberto Mejía", rtn: "0801-1985-12345" },
  { id: "CLI-002", nombre: "Constructora HN S.A.", rtn: "0501-2001-00892" },
  { id: "CLI-003", nombre: "Taller Morales & Asociados", rtn: "0801-1979-65432" },
];

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

  // CAI: siempre viene de configuración, es solo lectura en esta pantalla
  const caiNumero = CAI_PREDETERMINADO.numero;
  const caiRangoInicio = CAI_PREDETERMINADO.rangoInicio;
  const caiRangoFin = CAI_PREDETERMINADO.rangoFin;
  const caiFactura = CAI_PREDETERMINADO.facturaActual;
  const caiFecha = CAI_PREDETERMINADO.fechaLimite;
  const caiRtn = CAI_PREDETERMINADO.rtn;
  const sucursal = ref("Sucursal Central");
  const setSucursal = (next: any) => { sucursal.value = typeof next === 'function' ? next(sucursal.value) : next; };
  const tipoPago = ref<"contado" | "credito">("contado");
  const setTipoPago = (next: any) => { tipoPago.value = typeof next === 'function' ? next(tipoPago.value) : next; };

  const ISV15 = 0.15;

  const agregarProducto = (p: typeof productosDisponibles[0]) => {
    setLineas((prev) => [
      ...prev,
      {
        id: lineaId++,
        nombre: p.nombre,
        codigo: p.id,
        cantidad: 1,
        precio: p.precio,
        descuento: 0,
        exento: false,
        exonerado: false,
      },
    ]);
    setBusqProd("");
  };

  const agregarServicio = (s: typeof serviciosDisponibles[0]) => {
    setServicios((prev) => [
      ...prev,
      {
        id: servicioId++,
        descripcion: s.descripcion,
        codigo: s.id,
        cantidad: 1,
        precio: s.precio,
        descuento: 0,
      },
    ]);
    setBusqServ("");
  };

  const agregarServicioPersonalizado = () => {
    if (!servicioPersonalizado.value.descripcion.trim() || servicioPersonalizado.value.precio <= 0) return;
    setServicios((prev) => [
      ...prev,
      {
        id: servicioId++,
        descripcion: servicioPersonalizado.value.descripcion,
        codigo: "SRV-CUSTOM",
        cantidad: 1,
        precio: servicioPersonalizado.value.precio,
        descuento: 0,
      },
    ]);
    setServicioPersonalizado({ descripcion: "", precio: 0 });
    setMostrarServicioPersonalizado(false);
  };

  const actualizarLinea = (id: number, campo: keyof LineaProducto, valor: number | boolean) => {
    setLineas((prev) => prev.map((l) => (l.id === id ? { ...l, [campo]: valor } : l)));
  };

  const actualizarServicio = (id: number, campo: keyof LineaServicio, valor: number) => {
    setServicios((prev) => prev.map((s) => (s.id === id ? { ...s, [campo]: valor } : s)));
  };

  const eliminarLinea = (id: number) => setLineas((prev) => prev.filter((l) => l.id !== id));

  const eliminarServicio = (id: number) => setServicios((prev) => prev.filter((s) => s.id !== id));

  const calcTotales = () => {
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

    // Servicios y mano de obra (gravados con ISV)
    servicios.value.forEach((s) => {
      const bruto = s.cantidad * s.precio;
      const desc = bruto * (s.descuento / 100);
      const neto = bruto - desc;
      subtotalServicios += bruto;
      descuentos += desc;
      isv15 += neto * ISV15;
    });

    subtotal += subtotalServicios;
    const total = subtotal - descuentos + isv15;
    return { subtotal, subtotalServicios, descuentos, exento, exonerado, isv15, total };
  };

  const t = calcTotales();
  const fmt = (n: number) => `L. ${n.toLocaleString("es-HN", { minimumFractionDigits: 2 })}`;

  const filtProd = productosDisponibles.filter(
    (p) => p.nombre.toLowerCase().includes(busqProd.value.toLowerCase()) && busqProd.value.length > 0
  );

  const filtServ = serviciosDisponibles.filter(
    (s) => s.descripcion.toLowerCase().includes(busqServ.value.toLowerCase()) && busqServ.value.length > 0
  );

  const clienteSeleccionado = clientesDisponibles.find((c) => c.id === cliente.value);

    return () => {
      return (
    <div class="space-y-5">
      {/* === BLOQUE CAI FISCAL === */}
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
                Código de Autorización de Impresión — SAR Honduras
              </div>
            </div>
          </div>
          {/* Indicador de solo lectura */}
          <div
            class="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: "rgba(255,255,255,0.08)", color: "#94A3B8", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            <Lock size={13} />
            Solo lectura · Configurable en{" "}
            <span style={{ color: "#38BDF8" }}>Configuración</span>
          </div>
        </div>

        {/* Campos CAI */}
        <div
          class="px-6 py-5"
          style={{ background: "#F8FBFF", borderTop: "1px solid #DBEAFE" }}
        >
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CAI número */}
            <div class="col-span-2 lg:col-span-4">
              <label class="block text-xs font-bold mb-1.5" style={{ color: "#1E3A5F" }}>
                Número de CAI
              </label>
              <input
                value={caiNumero}
                onChange={(e) => setCaiNumero((e.target as HTMLInputElement).value)}
                disabled={true}
                placeholder="Automático desde configuración"
                class="w-full px-3 py-2.5 rounded-xl text-sm outline-none font-mono"
                style={{
                  background: "#EFF6FF",
                  border: "1px solid #BFDBFE",
                  color: "#1D4ED8",
                  cursor: "not-allowed",
                }}
              />
            </div>

            <div>
              <label class="block text-xs font-bold mb-1.5" style={{ color: "#1E3A5F" }}>
                Rango autorizado — inicio
              </label>
              <input
                value={caiRangoInicio}
                onChange={(e) => setCaiRangoInicio((e.target as HTMLInputElement).value)}
                disabled={true}
                class="w-full px-3 py-2.5 rounded-xl text-xs outline-none font-mono"
                style={{
                  background: "#EFF6FF",
                  border: "1px solid #BFDBFE",
                  color: "#1D4ED8",
                  cursor: "not-allowed",
                }}
              />
            </div>

            <div>
              <label class="block text-xs font-bold mb-1.5" style={{ color: "#1E3A5F" }}>
                Rango autorizado — fin
              </label>
              <input
                value={caiRangoFin}
                onChange={(e) => setCaiRangoFin((e.target as HTMLInputElement).value)}
                disabled={true}
                class="w-full px-3 py-2.5 rounded-xl text-xs outline-none font-mono"
                style={{
                  background: "#EFF6FF",
                  border: "1px solid #BFDBFE",
                  color: "#1D4ED8",
                  cursor: "not-allowed",
                }}
              />
            </div>

            <div>
              <label class="block text-xs font-bold mb-1.5" style={{ color: "#1E3A5F" }}>
                Número de factura
              </label>
              <input
                value={caiFactura}
                onChange={(e) => setCaiFactura((e.target as HTMLInputElement).value)}
                disabled={true}
                class="w-full px-3 py-2.5 rounded-xl text-xs outline-none font-mono font-bold"
                style={{
                  background: "#EFF6FF",
                  border: "2px solid #38BDF8",
                  color: "#0369A1",
                  cursor: "not-allowed",
                }}
              />
            </div>

            <div>
              <label class="block text-xs font-bold mb-1.5" style={{ color: "#1E3A5F" }}>
                Fecha límite de emisión
              </label>
              <input
                type="date"
                value={caiFecha}
                onChange={(e) => setCaiFecha((e.target as HTMLInputElement).value)}
                disabled={true}
                class="w-full px-3 py-2.5 rounded-xl text-xs outline-none"
                style={{
                  background: "#EFF6FF",
                  border: "1px solid #BFDBFE",
                  color: "#1D4ED8",
                  cursor: "not-allowed",
                }}
              />
            </div>

            <div>
              <label class="block text-xs font-bold mb-1.5" style={{ color: "#1E3A5F" }}>
                RTN del negocio
              </label>
              <input
                value={caiRtn}
                onChange={(e) => setCaiRtn((e.target as HTMLInputElement).value)}
                disabled={true}
                class="w-full px-3 py-2.5 rounded-xl text-xs outline-none font-mono"
                style={{
                  background: "#EFF6FF",
                  border: "1px solid #BFDBFE",
                  color: "#1D4ED8",
                  cursor: "not-allowed",
                }}
              />
            </div>

            <div>
              <label class="block text-xs font-bold mb-1.5" style={{ color: "#1E3A5F" }}>
                Sucursal emisora
              </label>
              <div class="relative">
                <select
                  value={sucursal.value}
                  onChange={(e) => setSucursal((e.target as HTMLInputElement).value)}
                  class="w-full px-3 py-2.5 rounded-xl text-xs outline-none appearance-none"
                  style={{ background: "#fff", border: "1px solid #BFDBFE", color: "#1E3A5F" }}
                >
                  <option>Sucursal Central</option>
                  <option>Sucursal Norte</option>
                  <option>Sucursal Sur</option>
                </select>
                <ChevronDown size={12} class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#64748B" }} />
              </div>
            </div>

            {/* Tipo de compra */}
            <div class="col-span-2 lg:col-span-4">
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
              class="mt-5 rounded-xl p-4"
              style={{
                background: restantes <= 5 ? "#FEF2F2" : restantes <= 15 ? "#FFF7ED" : "#F0F9FF",
                border: `1px solid ${restantes <= 5 ? "#FECACA" : restantes <= 15 ? "#FED7AA" : "#BAE6FD"}`,
              }}
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <ShieldCheck size={13} style={{ color: restantes <= 5 ? "#F87171" : restantes <= 15 ? "#FB923C" : "#38BDF8" }} />
                  <span class="text-xs font-bold" style={{ color: restantes <= 5 ? "#DC2626" : restantes <= 15 ? "#C2410C" : "#0369A1" }}>
                    Uso del rango CAI actual
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
                    value={cliente.value}
                    onChange={(e) => setCliente((e.target as HTMLInputElement).value)}
                    class="w-full px-3 py-2.5 rounded-xl text-sm outline-none appearance-none"
                    style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#374151" }}
                  >
                    <option value="">— Cliente de contado / Seleccionar —</option>
                    {clientesDisponibles.map((c) => (
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
                  placeholder={clienteSeleccionado?.rtn ?? "0000-0000-00000"}
                  defaultValue={clienteSeleccionado?.rtn ?? ""}
                  class="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#111827" }}
                />
              </div>
              <div>
                <label
                  class="block text-xs font-semibold mb-1.5"
                  style={{ color: "#374151" }}
                >
                  Sucursal de venta
                </label>
                <select
                  class="w-full px-3 py-2.5 rounded-xl text-sm outline-none appearance-none"
                  style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#374151" }}
                >
                  <option>Sucursal Central</option>
                  <option>Sucursal Norte</option>
                  <option>Sucursal Sur</option>
                </select>
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
                onChange={(e) => setBusqProd((e.target as HTMLInputElement).value)}
                placeholder="Buscar y agregar producto..."
                class="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#111827" }}
              />
              {filtProd.length > 0 && (
                <div
                  class="absolute left-0 right-0 top-full mt-1 rounded-xl shadow-xl z-20 overflow-hidden"
                  style={{ background: "#fff", border: "1px solid #E2E8F0" }}
                >
                  {filtProd.map((p) => (
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
                          {p.id}
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-xs" style={{ color: "#38BDF8" }}>
                          {fmt(p.precio)}
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
              {filtServ.length > 0 && (
                <div
                  class="absolute left-0 right-0 top-full mt-1 rounded-xl shadow-xl z-20 overflow-hidden"
                  style={{ background: "#fff", border: "1px solid #E2E8F0" }}
                >
                  {filtServ.map((s) => (
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
                  Busca y selecciona servicios de taller arriba
                </p>
              </div>
            ) : (
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                      {["Servicio", "Cant.", "Precio unit.", "Desc. %", "Total", ""].map(
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
                      const bruto = s.cantidad * s.precio;
                      const neto = bruto * (1 - s.descuento / 100);
                      return (
                        <tr key={s.id} style={{ borderBottom: "1px solid #F8FAFC" }}>
                          <td class="py-2.5 pr-4">
                            <div
                              class="font-semibold text-xs"
                              style={{ color: "#0F172A" }}
                            >
                              {s.descripcion}
                            </div>
                            <div class="text-xs" style={{ color: "#94A3B8" }}>
                              {s.codigo}
                            </div>
                          </td>
                          <td class="py-2.5 pr-4">
                            <input
                              type="number"
                              min={1}
                              value={s.cantidad}
                              onChange={(e) =>
                                actualizarServicio(s.id, "cantidad", Number((e.target as HTMLInputElement).value))
                              }
                              class="w-16 px-2 py-1.5 rounded-lg text-xs text-center outline-none"
                              style={{
                                background: "#FFF7ED",
                                border: "1px solid #FDBA74",
                                color: "#111827",
                              }}
                            />
                          </td>
                          <td
                            class="py-2.5 pr-4 text-xs font-semibold"
                            style={{ color: "#374151" }}
                          >
                            {fmt(s.precio)}
                          </td>
                          <td class="py-2.5 pr-4">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={s.descuento}
                              onChange={(e) =>
                                actualizarServicio(s.id, "descuento", Number((e.target as HTMLInputElement).value))
                              }
                              class="w-16 px-2 py-1.5 rounded-lg text-xs text-center outline-none"
                              style={{
                                background: "#FFF7ED",
                                border: "1px solid #FDBA74",
                                color: "#111827",
                              }}
                            />
                          </td>
                          <td
                            class="py-2.5 pr-4 text-xs font-bold"
                            style={{ color: "#C2410C" }}
                          >
                            {fmt(neto)}
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

            {/* Agregar servicio personalizado */}
            <div class="mt-4">
              {!mostrarServicioPersonalizado.value ? (
                <button
                  onClick={() => setMostrarServicioPersonalizado(true)}
                  class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: "#FFF7ED",
                    color: "#C2410C",
                    border: "1px dashed #FDBA74",
                  }}
                >
                  <Plus size={14} /> Agregar servicio personalizado
                </button>
              ) : (
                <div
                  class="rounded-xl p-4"
                  style={{ background: "#FFF7ED", border: "1px solid #FDBA74" }}
                >
                  <p class="text-xs font-bold mb-3" style={{ color: "#C2410C" }}>
                    Servicio personalizado
                  </p>
                  <div class="space-y-2.5">
                    <input
                      value={servicioPersonalizado.value.descripcion}
                      onChange={(e) =>
                        setServicioPersonalizado({ ...servicioPersonalizado.value, descripcion: (e.target as HTMLInputElement).value })
                      }
                      placeholder="Descripción del servicio o mano de obra..."
                      class="w-full px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: "#fff", border: "1px solid #FDBA74", color: "#111827" }}
                    />
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={servicioPersonalizado.value.precio || ""}
                      onChange={(e) =>
                        setServicioPersonalizado({
                          ...servicioPersonalizado.value,
                          precio: Number((e.target as HTMLInputElement).value),
                        })
                      }
                      placeholder="Precio (L.)"
                      class="w-full px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: "#fff", border: "1px solid #FDBA74", color: "#111827" }}
                    />
                    <div class="flex gap-2">
                      <button
                        onClick={agregarServicioPersonalizado}
                        class="flex-1 py-2 rounded-xl text-sm font-semibold"
                        style={{
                          background: "linear-gradient(135deg,#FB923C,#F97316)",
                          color: "#fff",
                        }}
                      >
                        Agregar
                      </button>
                      <button
                        onClick={() => {
                          setMostrarServicioPersonalizado(false);
                          setServicioPersonalizado({ descripcion: "", precio: 0 });
                        }}
                        class="px-4 py-2 rounded-xl text-sm font-semibold"
                        style={{ background: "#fff", color: "#64748B", border: "1px solid #E2E8F0" }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
                { label: "Subtotal productos", value: fmt(t.subtotal - t.subtotalServicios), color: "#374151", show: lineas.value.length > 0 },
                { label: "Subtotal servicios", value: fmt(t.subtotalServicios), color: "#FB923C", show: servicios.value.length > 0 },
                { label: "Descuentos y rebajas", value: `- ${fmt(t.descuentos)}`, color: "#F87171", show: t.descuentos > 0 },
                { label: "Importe exento", value: fmt(t.exento), color: "#374151", show: t.exento > 0 },
                { label: "Importe exonerado", value: fmt(t.exonerado), color: "#374151", show: t.exonerado > 0 },
                { label: "ISV 15%", value: fmt(t.isv15), color: "#374151", show: true },
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
                  {fmt(t.total)}
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
                  class="w-full px-3 py-2.5 rounded-xl text-sm outline-none appearance-none"
                  style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#374151" }}
                >
                  <option>Efectivo</option>
                  <option>Tarjeta de crédito</option>
                  <option>Transferencia bancaria</option>
                  <option>Crédito interno</option>
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
              class="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all shadow-md"
              style={{
                background: "linear-gradient(135deg, #F87171, #FB923C)",
                color: "#fff",
                boxShadow: "0 4px 14px rgba(248,113,113,0.35)",
              }}
            >
              <Save size={15} /> Guardar venta
            </button>
            <button
              class="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all shadow-md"
              style={{
                background: "linear-gradient(135deg, #0F172A, #1E3A5F)",
                color: "#fff",
                boxShadow: "0 4px 14px rgba(15,23,42,0.30)",
              }}
            >
              <FileText size={15} /> Generar factura
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
                  RTN: {caiRtn}
                </div>
                <div
                  class="text-xs font-extrabold mt-1 tracking-widest"
                  style={{ color: "#38BDF8" }}
                >
                  FACTURA FISCAL
                </div>
                <div class="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
                  No.: {caiFactura}
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
                  {caiNumero}
                </p>
                <div class="flex gap-4 mt-1">
                  <span class="text-xs" style={{ color: "#64748B" }}>
                    Desde: <span class="font-mono" style={{ color: "#0369A1" }}>{caiRangoInicio}</span>
                  </span>
                  <span class="text-xs" style={{ color: "#64748B" }}>
                    Hasta: <span class="font-mono" style={{ color: "#0369A1" }}>{caiRangoFin}</span>
                  </span>
                </div>
                <p class="text-xs mt-1" style={{ color: "#64748B" }}>
                  Límite de emisión:{" "}
                  <span class="font-semibold" style={{ color: "#0369A1" }}>
                    {caiFecha}
                  </span>{" "}
                  · Sucursal:{" "}
                  <span class="font-semibold" style={{ color: "#0369A1" }}>
                    {sucursal.value}
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
                      {clienteSeleccionado?.nombre ?? "Contado"}
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
        </div>
      </div>
    </div>
  );
    };
  },
});

</script>
