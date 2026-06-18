<script lang="tsx">
import { defineComponent, ref } from 'vue';
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
import type { Page } from './types';
import { store, type SesionUsuario } from './store';
import { getToken } from './lib/token';

export default defineComponent({
  name: 'App',
  setup() {
    const autenticado = ref(false);
    const paginaActual = ref<Page>('panel');
    const mostrarLogin = ref(false);
    const usuario = ref<SesionUsuario | null>(null);

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
          onLogout={() => { autenticado.value = false; usuario.value = null; paginaActual.value = 'panel'; }}
        >
          {renderPagina()}
        </Layout>
      );
    };
  },
});
</script>
