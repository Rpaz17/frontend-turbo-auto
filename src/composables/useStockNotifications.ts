import { ref } from "vue";
import { BASE_URL } from "../lib/http";

export interface StockAgotadoNotification {
  id: string;
  producto_id: string;
  producto_nombre: string;
  sucursal_id: string;
  sucursal_nombre?: string;
  cantidad: number;
  factura_id: string;
  numero_factura: string;
  created_at: string;
}

const CHANNEL_NAME = "turbo-auto-stock";
const notifications = ref<StockAgotadoNotification[]>([]);
const latest = ref<StockAgotadoNotification | null>(null);
const connected = ref(false);
let source: EventSource | null = null;
let channel: BroadcastChannel | null = null;
let latestTimer: number | undefined;
let started = false;

export function broadcastFacturaCreada() {
  window.dispatchEvent(new CustomEvent("turbo:factura-creada"));

  if ("BroadcastChannel" in window) {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type: "factura-creada" });
    channel.close();
  }
}

export function useStockNotifications() {
  const publishLocalRefresh = () => {
    window.dispatchEvent(new CustomEvent("turbo:factura-creada"));
  };

  const pushNotification = (notification: StockAgotadoNotification) => {
    notifications.value = [
      notification,
      ...notifications.value.filter((item) => item.id !== notification.id),
    ].slice(0, 20);
    latest.value = notification;
    publishLocalRefresh();

    if (latestTimer) window.clearTimeout(latestTimer);
    latestTimer = window.setTimeout(() => {
      latest.value = null;
    }, 6500);
  };

  const removeNotification = (id: string) => {
    notifications.value = notifications.value.filter((item) => item.id !== id);
    if (latest.value?.id === id) latest.value = null;
  };

  const clearNotifications = () => {
    notifications.value = [];
    latest.value = null;
  };

  const start = () => {
    if (started) return;
    started = true;

    source = new EventSource(`${BASE_URL}/notificaciones/stock`);
    source.addEventListener("open", () => {
      connected.value = true;
    });
    source.addEventListener("error", () => {
      connected.value = false;
    });
    source.addEventListener("stock-agotado", (event) => {
      pushNotification(JSON.parse((event as MessageEvent).data));
    });

    if ("BroadcastChannel" in window) {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.addEventListener("message", (event) => {
        if (event.data?.type === "factura-creada") publishLocalRefresh();
      });
    }
  };

  return {
    notifications,
    latest,
    connected,
    start,
    removeNotification,
    clearNotifications,
  };
}
