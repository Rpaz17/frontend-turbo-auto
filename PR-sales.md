# vue-router + Historial de Ventas

## Qué se hizo

Se reemplazó el enrutamiento manual con `switch`/`ref<Page>` en `App.vue` por `vue-router`. Cada página tiene su propio endpoint con chunks lazy-loaded. Se agregó guard de autenticación y una nueva sección **Historial de Ventas** para consultar, ver detalle y reimprimir facturas.

## Rutas

| Path | Página | Auth |
|------|--------|------|
| `/` | Storefront (catálogo público) | — |
| `/login` | Login | — |
| `/panel` | Dashboard | JWT |
| `/inventario` | Inventario | JWT |
| `/ventas` | Nueva factura | JWT |
| `/historial` | Historial de Ventas | JWT |
| `/clientes` | Clientes | JWT |
| `/reportes` | Reportes | JWT |
| `/sucursales` | Sucursales | JWT |
| `/configuracion` | Configuración | JWT |

## Cambios principales

### 1. vue-router + reorganización por páginas
- **Nueva dependencia**: `vue-router`
- **Nuevo**: `src/router/index.ts` con lazy loading, `beforeEach` auth guard y redirect con query param
- **Nuevo**: `src/composables/useSharedSucursales.ts` — singleton reactivo
- **Nuevo**: `src/pages/` — 10 page wrappers delgados que importan los componentes existentes
- **Simplificado**: `App.vue` (120→40 líneas, solo error boundary + `router-view`)
- **Refactorizados**: `Layout.vue` (usa `useRoute`/`router-link` en vez de props/emits), `Dashboard.vue`, `Login.vue`, `Storefront.vue`, `ProductDetail.vue` (usan `router.push` en vez de emits)
- **Smart auth**: botón Admin redirige a `/panel` si hay sesión, `/login` si no. Rutas protegidas redirigen a `/login?redirect=...`
- **Cleanup**: eliminado tipo `Page` de `types.ts`

### 2. Historial de Ventas (`/historial`)
- Tabla con número de factura, fecha, cliente, RTN y total calculado
- Filtros por rango de fecha (desde/hasta) + búsqueda por número, cliente o RTN
- Paginación de 8 facturas por página
- **Master-detail split**: click en fila → detalle a la derecha con productos, servicios, breakdown de ISV y total
- **Reimprimir**: botón que llama `exportFactura(id)` y abre el HTML en ventana nueva
- Auto-refresh al escuchar evento `turbo:factura-creada`
- Total calculado client-side: Σ(productos × precio) + Σ(servicios) + ISV 15%
- Sidebar: ícono `Clock`, color violeta `#A78BFA`, debajo de Facturación

### 3. Correcciones en facturación
- `generateFactura` (POST) espera respuesta sin wrapper `{ data }` (la API devuelve la factura directa)
- `getFacturaById` (GET) espera respuesta con wrapper `{ data: Factura }`
- Agregado `rtn_cliente` al DTO de creación y al payload de NuevaVenta
- `productos` ahora es opcional en el DTO (permite facturas con solo servicios)

## Archivos

| Tipo | Archivo | Cambio |
|------|---------|--------|
| Nuevo | `src/router/index.ts` | Config de rutas + auth guard |
| Nuevo | `src/composables/useSharedSucursales.ts` | Singleton de sucursales |
| Nuevo | `src/pages/*.vue` (10 archivos) | Page wrappers |
| Nuevo | `src/components/HistorialVentas.vue` | Componente principal |
| Modificado | `src/main.ts` | `.use(router)` |
| Modificado | `src/App.vue` | Simplificado a error boundary + router-view |
| Modificado | `src/components/Layout.vue` | Router links + nav item historial |
| Modificado | `src/components/Dashboard.vue` | `router.push` en vez de emits |
| Modificado | `src/components/Login.vue` | `router.push` con redirect |
| Modificado | `src/components/Storefront.vue` | Smart admin button |
| Modificado | `src/components/ProductDetail.vue` | Smart admin button |
| Modificado | `src/api/facturas.ts` | Corrección de wrappers en respuestas |
| Modificado | `src/api/schemas.ts` | `rtn_cliente`, `productos` opcional |
| Modificado | `src/components/NuevaVenta.vue` | Incluye `rtn_cliente` en payload |
| Modificado | `src/types.ts` | Eliminado tipo `Page` |

## Build
Code splitting por página: chunks de 4–20 KB cada uno, bundle principal ~230 KB.
