<script lang="tsx">
import { defineComponent, onErrorCaptured, ref } from 'vue';
import Login from './components/Login.vue';
import Layout from './components/Layout.vue';
import Dashboard from './components/Dashboard.vue';
import Inventario from './components/Inventario.vue';
import NuevaVenta from './components/NuevaVenta.vue';
import Clientes from './components/Clientes.vue';
import Reportes from './components/Reportes.vue';
import Sucursales from './components/Sucursales.vue';
import Configuracion from './components/Configuracion.vue';
import Storefront from './components/Storefront.vue';
import InternalErrorScreen from './components/InternalErrorScreen.vue';
import type { Page, SucursalBase } from './types';
import { hasToken, logout } from './api';

const sucursalesIniciales: SucursalBase[] = [
  {
    id: "SUC-001", nombre: "Sucursal Central", direccion: "Col. Kennedy, Av. La Paz #145, Tegucigalpa",
    telefono: "+504 2235-1234", encargado: "María Reyes", productos: 1240, valorStock: "L. 680,000", estado: "Activa",
    stock: [
      { categoria: "Filtros", cantidad: 320 }, { categoria: "Frenos", cantidad: 185 },
      { categoria: "Motor", cantidad: 420 }, { categoria: "Eléctrico", cantidad: 210 }, { categoria: "Lubricantes", cantidad: 105 },
    ],
  },
  {
    id: "SUC-002", nombre: "Sucursal Norte", direccion: "Blvd. del Norte #890, San Pedro Sula",
    telefono: "+504 2553-4567", encargado: "Jorge Álvarez", productos: 980, valorStock: "L. 425,000", estado: "Activa",
    stock: [
      { categoria: "Filtros", cantidad: 280 }, { categoria: "Frenos", cantidad: 140 },
      { categoria: "Motor", cantidad: 310 }, { categoria: "Eléctrico", cantidad: 165 }, { categoria: "Lubricantes", cantidad: 85 },
    ],
  },
  {
    id: "SUC-003", nombre: "Sucursal Sur", direccion: "Col. Villa Real, 3a Calle SO, Choluteca",
    telefono: "+504 2882-6789", encargado: "Ana Mejía", productos: 198, valorStock: "L. 95,000", estado: "Activa",
    stock: [
      { categoria: "Filtros", cantidad: 48 }, { categoria: "Frenos", cantidad: 30 },
      { categoria: "Motor", cantidad: 65 }, { categoria: "Eléctrico", cantidad: 32 }, { categoria: "Lubricantes", cantidad: 23 },
    ],
  },
];



export default defineComponent({
  name: 'App',
  setup() {
    const autenticado = ref(hasToken());
    const paginaActual = ref<Page>('panel');
    const mostrarLogin = ref(false);
    const sucursales = ref<SucursalBase[]>(sucursalesIniciales);
    const appError = ref<Error | null>(null);

    onErrorCaptured((err) => {
      appError.value = err instanceof Error ? err : new Error(String(err));
      console.error('Error interno de la aplicación:', err);
      return false;
    });

    const sesionPorDefecto = (): SesionUsuario => {
      const admin = store.usuarios.find((u) => u.rol === 'admin') ?? store.usuarios[0];
      return { id: admin.id, nombre: admin.nombre, email: admin.email, rol: admin.rol, sucursalId: admin.sucursalId };
    };

    const sesionDesdeToken = (): SesionUsuario | null => {
      const token = getToken();
      const payload = token?.split('.')[1];
      if (!payload) return null;
      try {
        const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
        const email = String(json.email ?? json.username ?? json.sub ?? '');
        const local = store.usuarios.find((u) => u.email.toLowerCase() === email.toLowerCase() || u.email.split('@')[0] === email.toLowerCase());
        const rol = json.admin === true || json.rol === 'admin' || json.role === 'admin' ? 'admin' : 'sucursal';
        const sucursalId = String(json.sucursalId ?? json.sucursal_id ?? local?.sucursalId ?? store.sucursales[0]?.id);
        return {
          id: String(json.id ?? json.user_id ?? local?.id ?? 'USR-TOKEN'),
          nombre: String(json.nombre ?? json.displayName ?? json.name ?? local?.nombre ?? email),
          email: local?.email ?? email,
          rol,
          sucursalId,
        };
      } catch {
        return null;
      }
    };

    const renderPagina = () => {
      switch (paginaActual.value) {
        case 'panel': return <Dashboard onNavigate={(p: Page | string) => (paginaActual.value = p as Page)} />;
        case 'inventario': return <Inventario />;
        case 'ventas': return usuario.value ? <NuevaVenta usuario={usuario.value} /> : null;
        case 'clientes': return <Clientes />;
        case 'reportes': return <Reportes />;
        case 'sucursales': return <Sucursales />;
        case 'configuracion': return usuario.value ? <Configuracion usuario={usuario.value} /> : null;
        default: return <Dashboard onNavigate={(p: Page | string) => (paginaActual.value = p as Page)} />;
      }
    };

    return () => {
      if (appError.value) {
        return (
          <InternalErrorScreen
            title="Error interno"
            message="Ocurrió un problema inesperado en el panel. Puedes intentar recargar la vista."
            actionLabel="Recargar vista"
            secondaryLabel="Ir al inicio"
            onRetry={() => (appError.value = null)}
            onSecondary={() => {
              appError.value = null;
              paginaActual.value = 'panel';
              mostrarLogin.value = false;
            }}
          />
        );
      }
      if (!autenticado.value && mostrarLogin.value) {
        return <Login onLogin={(sesion?: SesionUsuario) => { usuario.value = sesion ?? sesionDesdeToken() ?? sesionPorDefecto(); autenticado.value = true; }} onVolver={() => (mostrarLogin.value = false)} />;
      }
      if (!autenticado.value) {
        return <Storefront onIrLogin={() => (mostrarLogin.value = true)} />;
      }
      if (paginaActual.value === 'storefront') {
        return <Storefront onIrLogin={() => (paginaActual.value = 'panel')} />;
      }
      return (
        <Layout
          currentPage={paginaActual.value}
          usuario={usuario.value}
          onNavigate={(p: Page) => (paginaActual.value = p)}
          onLogout={() => {
            logout();
            autenticado.value = false;
            paginaActual.value = 'panel';
          }}
        >
          {renderPagina()}
        </Layout>
      );
    };
  },
});
</script>
