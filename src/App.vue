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

    const setSucursales = (next: any) => {
      sucursales.value = typeof next === 'function' ? next(sucursales.value) : next;
    };

    const renderPagina = () => {
      switch (paginaActual.value) {
        case 'panel': return <Dashboard onNavigate={(p: Page | string) => (paginaActual.value = p as Page)} />;
        case 'inventario': return <Inventario sucursales={sucursales.value} />;
        case 'ventas': return <NuevaVenta />;
        case 'clientes': return <Clientes />;
        case 'reportes': return <Reportes />;
        case 'sucursales': return <Sucursales sucursales={sucursales.value} onSetSucursales={setSucursales} />;
        case 'configuracion': return <Configuracion />;
        default: return <Dashboard onNavigate={(p: Page | string) => (paginaActual.value = p as Page)} />;
      }
    };

    return () => {
      if (!autenticado.value && mostrarLogin.value) {
        return <Login onLogin={() => (autenticado.value = true)} onVolver={() => (mostrarLogin.value = false)} />;
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
