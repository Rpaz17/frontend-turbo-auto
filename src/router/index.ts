import { createRouter, createWebHistory } from 'vue-router';
import { hasToken } from '../api';
import Layout from '../components/Layout.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'storefront',
      component: () => import('../pages/StorefrontPage.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../pages/LoginPage.vue'),
    },
    {
      path: '/',
      component: Layout,
      children: [
        {
          path: 'panel',
          name: 'panel',
          component: () => import('../pages/DashboardPage.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'inventario',
          name: 'inventario',
          component: () => import('../pages/InventarioPage.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'ventas',
          name: 'ventas',
          component: () => import('../pages/NuevaVentaPage.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'historial',
          name: 'historial',
          component: () => import('../pages/HistorialVentasPage.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'clientes',
          name: 'clientes',
          component: () => import('../pages/ClientesPage.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'reportes',
          name: 'reportes',
          component: () => import('../pages/ReportesPage.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'sucursales',
          name: 'sucursales',
          component: () => import('../pages/SucursalesPage.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'configuracion',
          name: 'configuracion',
          component: () => import('../pages/ConfiguracionPage.vue'),
          meta: { requiresAuth: true },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
});

router.beforeEach((to, _from, next) => {
  if (to.meta.requiresAuth && !hasToken()) {
    next({ name: 'login', query: { redirect: to.fullPath } });
  } else {
    next();
  }
});

export default router;
