import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  // ======================================================
  // --- 1. RUTAS PÚBLICAS ---
  // ======================================================
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then(m => m.RegisterPage)
  },

  // ======================================================
  // --- 2. VISTAS MÓVILES (Agrupadas bajo /mobile) ---
  // ======================================================
  {
    path: 'mobile',
    canActivate: [authGuard], // Protegemos toda la sección móvil
    children: [
      {
        path: 'home', // URL: /mobile/home
        loadComponent: () => import('./pages/vista-movil/home-movil/home-movil.page').then(m => m.HomeMovilPage)
      },
      {
        path: 'combustible', // URL: /mobile/combustible
        loadComponent: () => import('./pages/vista-movil/combustible-movil/combustible-movil.page').then(m => m.CombustibleMovilPage)
      },
      {
        path: 'incidente', // URL: /mobile/incidente
        loadComponent: () => import('./pages/vista-movil/incidente-movil/incidente-movil.page').then(m => m.IncidenteMovilPage)
      },
      {
        path: 'servicios-tecnico', // URL: /mobile/servicios-tecnico
        loadComponent: () => import('./pages/vista-movil/servicios-tecnico-movil/servicios-tecnico.page').then(m => m.ServiciosTecnicoPage)
      },
      {
        path: 'servicio-detalle/:id', // URL: /mobile/servicio-detalle/COD-001
        loadComponent: () => import('./pages/vista-movil/servicio-detalle-movil/servicio-detalle.page').then(m => m.ServicioDetallePage)
      },
      {
        // Redirección por defecto para /mobile -> /mobile/home
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      }
    ]
  },

  // =================================================================
  // --- 3. PANEL DE ADMINISTRACIÓN (Agrupado bajo /panel) ---
  // =================================================================
  {
    path: 'panel',
    canActivate: [authGuard], // Protegemos todo el panel
    children: [
      {
        path: 'dashboard', // URL: /panel/dashboard
        loadComponent: () => import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage)
      },
      {
        path: 'recorridos', // URL: /panel/recorridos
        loadComponent: () => import('./pages/recorridos/recorridos.page').then(m => m.HomePage)
      },
      // --- Gestión de Rutas ---
      {
        path: 'rutas', // URL: /panel/rutas
        children: [
          {
            path: '', // Muestra la lista en /panel/rutas
            loadComponent: () => import('./pages/route-list/route-list.page').then(m => m.RouteListPage)
          },
          {
            path: 'nueva', // URL: /panel/rutas/nueva
            loadComponent: () => import('./pages/route-form/route-form.page').then(m => m.RouteFormPage)
          },
          {
            path: 'edit/:id', // URL: /panel/rutas/edit/123
            loadComponent: () => import('./pages/route-form/route-form.page').then(m => m.RouteFormPage)
          },
        ]
      },
      // --- Gestión de Vehículos ---
      {
        path: 'vehiculos', // URL: /panel/vehiculos
        children: [
          {
            path: '', // Muestra la lista en /panel/vehiculos
            loadComponent: () => import('./pages/vehicle-list/vehicle-list.page').then(m => m.VehicleListPage)
          },
          {
            path: 'new', // URL: /panel/vehiculos/new
            loadComponent: () => import('./pages/vehicle-form/vehicle-form.page').then(m => m.VehicleFormPage)
          },
          {
            path: 'edit/:id', // URL: /panel/vehiculos/edit/123
            loadComponent: () => import('./pages/vehicle-form/vehicle-form.page').then(m => m.VehicleFormPage)
          }
        ]
      },
      // --- Gestión de Mantenimiento ---
      {
        path: 'maintenance', // URL: /panel/maintenance
        children: [
          {
            path: 'planificacion-list', // URL: /panel/maintenance/planificacion-list
            loadComponent: () => import('./pages/maintenance/planificacion-list/planificacion-list.page').then(m => m.PlanificacionListPage)
          },
          {
            path: 'planificacion-form', // URL: /panel/maintenance/planificacion-form
            loadComponent: () => import('./pages/maintenance/planificacion-form/planificacion-form.page').then(m => m.PlanificacionFormPage)
          },
          {
            path: 'orden-trabajo-list', // URL: /panel/maintenance/orden-trabajo-list
            loadComponent: () => import('./pages/maintenance/orden-trabajo-list/orden-trabajo-list.page').then(m => m.OrdenTrabajoListPage)
          },
          {
            path: 'orden-trabajo-detalle/:id', // URL: /panel/maintenance/orden-trabajo-detalle/123
            loadComponent: () => import('./pages/maintenance/orden-trabajo-detalle/orden-trabajo-detalle.page').then(m => m.OrdenTrabajoDetallePage)
          }
        ]
      },
      // --- Gestión de Asignaciones ---
      {
        path: 'asignaciones', // URL: /panel/asignaciones
        children: [
            {
                path: '', // Muestra la lista en /panel/asignaciones
                loadComponent: () => import('./pages/asignacion-list/asignacion-list.page').then(m => m.AsignacionListPage)
            },
            {
                path: 'nueva', // URL: /panel/asignaciones/nueva
                loadComponent: () => import('./pages/asignacion-form/asignacion-form.page').then(m => m.AsignacionFormPage)
            },
            {
                path: 'editar/:idAsig', // URL: /panel/asignaciones/editar/123
                loadComponent: () => import('./pages/asignacion-form/asignacion-form.page').then(m => m.AsignacionFormPage)
            }
        ]
      },
      {
        // Redirección por defecto para /panel -> /panel/dashboard
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  // ======================================================
  // --- 4. REDIRECCIÓN PRINCIPAL ---
  // ======================================================
  {
    path: '',
    redirectTo: '/panel/dashboard', // Al entrar a la app, si estás logueado, te manda al dashboard del panel
    pathMatch: 'full'
  },
  
  // ======================================================
  // --- 5. RUTA COMODÍN (WILDCARD) ---
  // ======================================================
  // Opcional pero recomendado: si el usuario pone una URL que no existe, lo redirige.
  {
    path: '**',
    redirectTo: '/panel/dashboard' // O a una página '404 Not Found'
  }
];