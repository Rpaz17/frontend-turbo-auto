<script lang="tsx">
import { defineComponent, ref, computed, onMounted } from 'vue';
import {
  Search, Plus, Trash2, FileText, Printer, Eye, ChevronDown,
  User, Package, ShieldCheck, Lock, Save, X,
  CreditCard, Banknote, Wrench, Loader2, AlertCircle, Calendar, Download, RefreshCw
} from "lucide-vue-next";
import { useProductos, formatPrecio } from '../composables/useProductos';
import { useClientes } from '../composables/useClientes';
import { useSucursales } from '../composables/useSucursales';
import type { Product, Client, Sucursal, Factura } from '../api/schemas';
import { generateFactura, exportFactura, getFacturas, getUserIdFromToken } from '../api';
import { getInventario } from '../api/inventario';
import { broadcastFacturaCreada } from '../composables/useStockNotifications';

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
  stockDisponible?: number;
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

function numero(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function fechaInput(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fechaHoraApi(date: Date, finDelDia = false) {
  const copy = new Date(date);
  if (finDelDia) copy.setHours(23, 59, 59, 999);
  else copy.setHours(0, 0, 0, 0);
  return `${fechaInput(copy)}T${String(copy.getHours()).padStart(2, "0")}:${String(copy.getMinutes()).padStart(2, "0")}:${String(copy.getSeconds()).padStart(2, "0")}.${String(copy.getMilliseconds()).padStart(3, "0")}`;
}

function rangoSemana(fecha: string) {
  const base = fecha ? new Date(`${fecha}T12:00:00`) : new Date();
  const day = base.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const inicio = new Date(base);
  inicio.setDate(base.getDate() + mondayOffset);
  const fin = new Date(inicio);
  fin.setDate(inicio.getDate() + 6);
  return { inicio, fin };
}

function totalFactura(factura: Factura) {
  const productos = factura.productos?.reduce((acc, p) => acc + numero(p.precio) * numero(p.cantidad), 0) ?? 0;
  const servicios = factura.servicios?.reduce((acc, s) => acc + numero(s.total), 0) ?? 0;
  return productos + servicios;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function abrirPdfFacturasSemanales(facturas: Factura[], desde: Date, hasta: Date, cliente: string, formatMoney: (n: number) => string) {
  const total = facturas.reduce((acc, factura) => acc + totalFactura(factura), 0);
  const rows = facturas.map((factura) => `
    <tr>
      <td>${escapeHtml(factura.numero_factura)}</td>
      <td>${escapeHtml(new Date(factura.fecha_emision).toLocaleDateString("es-HN"))}</td>
      <td>${escapeHtml(factura.cliente?.nombre ?? "Consumidor Final")}</td>
      <td class="num">${escapeHtml(formatMoney(totalFactura(factura)))}</td>
    </tr>
  `).join("");
  const doc = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Facturas semanales</title>
  <style>
    @page { size: letter; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 14mm; font-family: Arial, sans-serif; color: #0f172a; background: #fff; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
    .brand { font-size: 20px; font-weight: 800; }
    .meta { text-align: right; font-size: 11px; color: #64748b; line-height: 1.5; }
    .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
    .box { border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 10px; padding: 10px; }
    .label { color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase; }
    .value { font-size: 16px; font-weight: 800; margin-top: 5px; }
    table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
    th { text-align: left; background: #0f172a; color: #fff; padding: 8px; font-size: 10px; }
    td { border-bottom: 1px solid #e2e8f0; padding: 7px 8px; }
    .num { text-align: right; white-space: nowrap; }
    .empty { color: #94a3b8; text-align: center; padding: 12px; background: #f8fafc; }
    .actions { margin-top: 18px; text-align: center; }
    button { border: 0; border-radius: 10px; background: #0f172a; color: #fff; padding: 11px 18px; font-size: 12px; font-weight: 800; cursor: pointer; }
    @media print { .actions { display: none; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Turbo Auto F&amp;M 504</div>
      <div class="label">Facturas semanales</div>
    </div>
    <div class="meta">
      <div><strong>Semana:</strong> ${escapeHtml(desde.toLocaleDateString("es-HN"))} al ${escapeHtml(hasta.toLocaleDateString("es-HN"))}</div>
      ${cliente ? `<div><strong>Cliente:</strong> ${escapeHtml(cliente)}</div>` : ""}
      <div><strong>Generado:</strong> ${escapeHtml(new Date().toLocaleString("es-HN"))}</div>
    </div>
  </div>
  <div class="summary">
    <div class="box"><div class="label">Facturas</div><div class="value">${facturas.length.toLocaleString("es-HN")}</div></div>
    <div class="box"><div class="label">Total semanal</div><div class="value">${escapeHtml(formatMoney(total))}</div></div>
    <div class="box"><div class="label">Promedio</div><div class="value">${escapeHtml(formatMoney(facturas.length ? total / facturas.length : 0))}</div></div>
  </div>
  <table>
    <thead><tr><th>Factura</th><th>Fecha</th><th>Cliente</th><th class="num">Total</th></tr></thead>
    <tbody>${rows || `<tr><td colspan="4" class="empty">Sin facturas en esta semana</td></tr>`}</tbody>
  </table>
  <div class="actions"><button type="button" onclick="window.print()">Imprimir / Exportar PDF</button></div>
  <script>window.addEventListener("load", () => setTimeout(() => window.print(), 250));<\/script>
</body>
</html>`;
  const printWindow = window.open("", "_blank");
  if (!printWindow) return false;
  printWindow.document.open();
  printWindow.document.write(doc);
  printWindow.document.close();
  return true;
}


export default defineComponent({
  name: 'NuevaVenta',
  
  
  setup() {
    const { productos, loading: loadingProds } = useProductos();
    const { clientes, load: loadClientes, loading: loadingClientes } = useClientes();
    const { sucursales, load: loadSucursales } = useSucursales();

    onMounted(() => {
      loadClientes();
      loadSucursales();
      cargarFacturas();
    });

    const clienteId = ref("");
    const sucursalId = ref("");
    const busqProd = ref("");
    const lineas = ref<LineaProducto[]>([]);
    const servicios = ref<LineaServicio[]>([]);
    const vistaPrevia = ref(false);
    const tipoPago = ref<"contado" | "credito">("contado");
    const popup = ref<{
      open: boolean;
      title: string;
      message: string;
      tone: "error" | "warning" | "success";
    }>({
      open: false,
      title: "",
      message: "",
      tone: "error",
    });
    const facturas = ref<Factura[]>([]);
    const cargandoFacturas = ref(false);
    const exportandoSemana = ref(false);
    const filtroFechaFactura = ref("");
    const filtroClienteFactura = ref("");

    const mostrarPopup = (
      title: string,
      message: string,
      tone: "error" | "warning" | "success" = "error",
    ) => {
      popup.value = { open: true, title, message, tone };
    };

    const cerrarPopup = () => {
      popup.value = { ...popup.value, open: false };
    };

    const fmt = (n: number | undefined | null) => {
      if (n === undefined || n === null || Number.isNaN(n)) return 'L. 0.00';
      return `L. ${n.toLocaleString("es-HN", { minimumFractionDigits: 2 })}`;
    };

    const cargarFacturas = async () => {
      cargandoFacturas.value = true;
      try {
        facturas.value = await getFacturas({
          ...(filtroFechaFactura.value
            ? {
                desde: fechaHoraApi(new Date(`${filtroFechaFactura.value}T12:00:00`)),
                hasta: fechaHoraApi(new Date(`${filtroFechaFactura.value}T12:00:00`), true),
              }
            : {}),
          ...(filtroClienteFactura.value.trim() ? { cliente: filtroClienteFactura.value.trim() } : {}),
        });
      } catch (err: any) {
        console.error("Error cargando facturas:", err);
        mostrarPopup("No se pudieron cargar las facturas", err?.message ?? "Intenta de nuevo en unos segundos.");
      } finally {
        cargandoFacturas.value = false;
      }
    };

    const verFactura = async (id: string) => {
      try {
        const html = await exportFactura(id);
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(html);
          newWindow.document.close();
        } else {
          mostrarPopup("No se pudo abrir la factura", "Permite las ventanas emergentes para visualizarla.", "warning");
        }
      } catch (err: any) {
        mostrarPopup("No se pudo abrir la factura", err?.message ?? "Intenta de nuevo.");
      }
    };

    const exportarFacturasSemanales = async () => {
      exportandoSemana.value = true;
      try {
        const { inicio, fin } = rangoSemana(filtroFechaFactura.value || fechaInput());
        const semanales = await getFacturas({
          desde: fechaHoraApi(inicio),
          hasta: fechaHoraApi(fin, true),
          ...(filtroClienteFactura.value.trim() ? { cliente: filtroClienteFactura.value.trim() } : {}),
        });
        const opened = abrirPdfFacturasSemanales(
          semanales,
          inicio,
          fin,
          filtroClienteFactura.value.trim(),
          fmt,
        );
        if (!opened) {
          mostrarPopup("No se pudo exportar", "Permite las ventanas emergentes para generar el PDF semanal.", "warning");
        }
      } catch (err: any) {
        console.error("Error exportando facturas semanales:", err);
        mostrarPopup("No se pudo exportar", err?.message ?? "Intenta de nuevo.");
      } finally {
        exportandoSemana.value = false;
      }
    };

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

    const agregarProducto = async (p: Product) => {
      if (!sucursalId.value) {
        mostrarPopup(
          "Selecciona una sucursal",
          "Primero elige la sucursal de venta para validar existencias antes de agregar productos.",
          "warning",
        );
        return;
      }

      let stockDisponible = 0;
      try {
        const inventario = await getInventario(sucursalId.value, p.id);
        stockDisponible = inventario.cantidad;
      } catch {
        mostrarPopup(
          "Producto sin stock",
          `${p.nombre} no tiene inventario registrado en la sucursal seleccionada.`,
          "warning",
        );
        return;
      }

      if (stockDisponible <= 0) {
        mostrarPopup(
          "Producto sin stock",
          `${p.nombre} no tiene existencias disponibles en la sucursal seleccionada.`,
          "warning",
        );
        return;
      }

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
        stockDisponible,
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
        mostrarPopup("Falta la sucursal", "Por favor, selecciona una sucursal para generar la factura.", "warning");
        return;
      }
      if (!clienteId.value) {
        mostrarPopup("Falta el cliente", "Por favor, selecciona un cliente para generar la factura.", "warning");
        return;
      }
      if (lineas.value.length === 0 && servicios.value.length === 0) {
        mostrarPopup("Factura vacía", "Agrega al menos un producto o servicio antes de generar la factura.", "warning");
        return;
      }

      const lineaSinStock = lineas.value.find((l) => l.stockDisponible !== undefined && l.cantidad > l.stockDisponible);
      if (lineaSinStock) {
        mostrarPopup(
          "Stock insuficiente",
          `${lineaSinStock.nombre} solo tiene ${lineaSinStock.stockDisponible} unidades disponibles en esta sucursal.`,
          "warning",
        );
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
          broadcastFacturaCreada();
          const newWindow = window.open();
          if (newWindow) {
            newWindow.document.write(html);
            newWindow.document.close();
          } else {
            mostrarPopup(
              "Factura generada",
              "La factura se generó correctamente, pero la ventana emergente fue bloqueada. Permite los pop-ups para verla.",
              "success",
            );
          }
          limpiarFormulario();
          await cargarFacturas();
        } else {
          mostrarPopup("No se pudo abrir la factura", "El backend no devolvió el ID de la factura generada.");
        }
      } catch (err: any) {
        console.error("Error al generar factura:", err);
        const backendMessage =
          Array.isArray(err?.data?.message) ? err.data.message.join(", ") :
          typeof err?.data?.message === "string" ? err.data.message :
          typeof err?.message === "string" ? err.message :
          "Ocurrió un error al generar la factura.";
        mostrarPopup("No se pudo generar la factura", backendMessage);
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

    const facturasFiltradas = computed(() => {
      const cliente = filtroClienteFactura.value.trim().toLowerCase();
      const fecha = filtroFechaFactura.value;

      return facturas.value.filter((factura) => {
        const nombreCliente = factura.cliente?.nombre?.toLowerCase() ?? "";
        const coincideCliente = !cliente || nombreCliente.includes(cliente);
        const coincideFecha = !fecha || fechaInput(new Date(factura.fecha_emision)) === fecha;
        return coincideCliente && coincideFecha;
      });
    });

    return () => {
      const popupStyle = {
        error: { bg: "#FEF2F2", color: "#DC2626", iconBg: "#FEE2E2", border: "#FECACA" },
        warning: { bg: "#FFF7ED", color: "#C2410C", iconBg: "#FFEDD5", border: "#FDBA74" },
        success: { bg: "#F0FDF4", color: "#16A34A", iconBg: "#DCFCE7", border: "#BBF7D0" },
      }[popup.value.tone];
      const semanaExportacion = rangoSemana(filtroFechaFactura.value || fechaInput());

      return (
    <div class="space-y-5">
      {popup.value.open && (
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.55)" }}>
          <div class="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" style={{ background: "#fff", border: `1px solid ${popupStyle.border}` }}>
            <div class="p-6">
              <div class="flex items-start gap-4">
                <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: popupStyle.iconBg }}>
                  <AlertCircle size={22} style={{ color: popupStyle.color }} />
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="font-bold text-base mb-1" style={{ color: "#0F172A" }}>{popup.value.title}</h3>
                  <p class="text-sm leading-relaxed" style={{ color: "#64748B" }}>{popup.value.message}</p>
                </div>
                <button onClick={cerrarPopup} class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#F8FAFC" }}>
                  <X size={16} style={{ color: "#64748B" }} />
                </button>
              </div>
            </div>
            <div class="px-6 py-4 flex justify-end" style={{ background: popupStyle.bg, borderTop: `1px solid ${popupStyle.border}` }}>
              <button onClick={cerrarPopup} class="px-4 py-2 rounded-xl text-sm font-bold" style={{ background: popupStyle.color, color: "#fff" }}>
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
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
                              {l.codigo}{l.stockDisponible !== undefined ? ` · Stock: ${l.stockDisponible}` : ""}
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

      <div class="rounded-2xl p-6 shadow-sm" style={{ background: "#fff", border: "1px solid rgba(15,23,42,0.06)" }}>
        <div class="flex flex-wrap items-end justify-between gap-4 mb-5">
          <div>
            <h3 class="font-bold flex items-center gap-2" style={{ color: "#0F172A" }}>
              <FileText size={16} style={{ color: "#38BDF8" }} /> Facturas emitidas
            </h3>
            <p class="text-xs mt-1" style={{ color: "#64748B" }}>
              Consulta por fecha o cliente. La exportación usa solo la semana seleccionada.
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              onClick={cargarFacturas}
              disabled={cargandoFacturas.value}
              class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "#F8FAFC", color: "#0F172A", border: "1px solid #E2E8F0" }}
            >
              {cargandoFacturas.value ? <Loader2 class="animate-spin" size={14} /> : <RefreshCw size={14} />} Aplicar filtros
            </button>
            <button
              onClick={exportarFacturasSemanales}
              disabled={exportandoSemana.value}
              class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "#0F172A", color: "#fff", border: "1px solid #0F172A" }}
            >
              {exportandoSemana.value ? <Loader2 class="animate-spin" size={14} /> : <Download size={14} />} Exportar semana
            </button>
          </div>
        </div>

        <div class="grid md:grid-cols-3 gap-3 mb-4">
          <div>
            <label class="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Fecha</label>
            <div class="relative">
              <Calendar size={13} class="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#94A3B8" }} />
              <input
                type="date"
                value={filtroFechaFactura.value}
                onChange={(e) => (filtroFechaFactura.value = (e.target as HTMLInputElement).value)}
                class="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#374151" }}
              />
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Nombre de cliente</label>
            <div class="relative">
              <Search size={13} class="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#94A3B8" }} />
              <input
                value={filtroClienteFactura.value}
                onInput={(e) => (filtroClienteFactura.value = (e.target as HTMLInputElement).value)}
                placeholder="Buscar cliente..."
                class="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#111827" }}
              />
            </div>
          </div>
          <div class="rounded-xl p-3" style={{ background: "#F0F9FF", border: "1px solid #BAE6FD" }}>
            <div class="text-xs font-semibold" style={{ color: "#0369A1" }}>Semana a exportar</div>
            <div class="text-sm font-bold mt-1" style={{ color: "#0F172A" }}>
              {semanaExportacion.inicio.toLocaleDateString("es-HN")} - {semanaExportacion.fin.toLocaleDateString("es-HN")}
            </div>
          </div>
        </div>

        <div class="overflow-x-auto rounded-xl" style={{ border: "1px solid #E2E8F0" }}>
          <table class="w-full text-sm">
            <thead style={{ background: "#F8FAFC" }}>
              <tr>
                {["Factura", "Fecha", "Cliente", "Productos", "Servicios", "Total", ""].map((h) => (
                  <th key={h} class="text-left px-4 py-3 text-xs font-bold" style={{ color: "#64748B" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cargandoFacturas.value ? (
                <tr><td colspan={7} class="px-4 py-8 text-center text-xs" style={{ color: "#94A3B8" }}>Cargando facturas...</td></tr>
              ) : facturasFiltradas.value.length === 0 ? (
                <tr><td colspan={7} class="px-4 py-8 text-center text-xs" style={{ color: "#94A3B8" }}>Sin facturas para los filtros seleccionados</td></tr>
              ) : (
                facturasFiltradas.value.map((factura) => (
                  <tr key={factura.id} style={{ borderTop: "1px solid #F1F5F9" }}>
                    <td class="px-4 py-3">
                      <div class="text-xs font-bold" style={{ color: "#0F172A" }}>{factura.numero_factura}</div>
                    </td>
                    <td class="px-4 py-3 text-xs" style={{ color: "#64748B" }}>{new Date(factura.fecha_emision).toLocaleDateString("es-HN")}</td>
                    <td class="px-4 py-3">
                      <div class="text-xs font-semibold" style={{ color: "#0F172A" }}>{factura.cliente?.nombre ?? "Consumidor Final"}</div>
                      <div class="text-xs" style={{ color: "#94A3B8" }}>{factura.rtn_cliente ?? factura.cliente?.rtn ?? "Sin RTN"}</div>
                    </td>
                    <td class="px-4 py-3 text-xs" style={{ color: "#64748B" }}>{factura.productos?.length ?? 0}</td>
                    <td class="px-4 py-3 text-xs" style={{ color: "#64748B" }}>{factura.servicios?.length ?? 0}</td>
                    <td class="px-4 py-3 text-xs font-bold" style={{ color: "#0F172A" }}>{fmt(totalFactura(factura))}</td>
                    <td class="px-4 py-3 text-right">
                      <button
                        onClick={() => verFactura(factura.id)}
                        class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
                        style={{ background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE" }}
                      >
                        <Eye size={12} /> Ver
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
    };
  },
});

</script>
