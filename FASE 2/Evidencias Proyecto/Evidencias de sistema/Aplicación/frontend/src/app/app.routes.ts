import { Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';
import { isConductorGuard } from './shared/guards/conductor.guard';
import { isTecnicoGuard } from './shared/guards/tecnico.guard';
import { GestorGuard } from './shared/guards/gestor.guard';
export const routes: Routes = [
  // --- Rutas Públicas ---
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then(m => m.RegisterPage)
  },  {
    path: 'home-movil',
    loadComponent: () => import('./features/mobile/home-movil/home-movil.page').then(m => m.HomeMovilPage),
    canActivate: [authGuard, isConductorGuard]
  },
  {
    path: 'combustible-movil',
    loadComponent: () => import('./features/mobile/combustible-movil/combustible-movil.page').then(m => m.CombustibleMovilPage),
    canActivate: [authGuard, isConductorGuard]
  },
  {
    path: 'incidente-movil',
    loadComponent: () => import('./features/mobile/incidente-movil/incidente-movil.page').then(m => m.IncidenteMovilPage),
    canActivate: [authGuard, isConductorGuard]
  },
    {
    path: 'servicios-tecnico-movil',
    loadComponent: () => import('./features/mobile/servicios-tecnico-movil/servicios-tecnico.page').then(m => m.ServiciosTecnicoPage),
    canActivate: [authGuard, isTecnicoGuard]
  },
  {
    path: 'servicio-detalle-movil/:id',
   
    loadComponent: () => import('./features/mobile/servicio-detalle-movil/servicio-detalle.page').then(m => m.ServicioDetallePage),
    canActivate: [authGuard, isTecnicoGuard]
  },
  
{
    path: 'historial-combustible',
    loadComponent: () => import('./features/mobile/historial-combustible/historial-combustible.page').then( m => m.HistorialCombustiblePage),
    canActivate: [authGuard, isConductorGuard]
  },
  // --- Rutas Privadas ---
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage)
  },  {
    path: 'recorridos',
    canActivate: [authGuard],
    loadComponent: () => import('./features/route-management/recorridos/recorridos.page').then(m => m.HomePage)
  },
  {
    path: 'rutas',
    canActivate: [authGuard],
    data: { title: 'Gestión de Rutas' },
    loadComponent: () => import('./features/route-management/route-list/route-list.page').then(m => m.RouteListPage)
  },
  {
    path: 'rutas/nueva',
    canActivate: [authGuard],
    data: { title: 'Nueva Ruta' },
    loadComponent: () => import('./features/route-management/route-form/route-form.page').then(m => m.RouteFormPage)
  },
  {
    path: 'rutas/edit/:id',
    canActivate: [authGuard],
    data: { title: 'Editar Ruta' },
    loadComponent: () => import('./features/route-management/route-form/route-form.page').then(m => m.RouteFormPage)
  },
  {
    path: 'vehiculos',
    canActivate: [authGuard],
    data: { title: 'Vehículos' },
    loadComponent: () => import('./pages/vehicle-list/vehicle-list.page').then(m => m.VehicleListPage)
  },  {
    path: 'vehiculos/new',
    canActivate: [authGuard],
    data: { title: 'Nuevo Vehículo' },
    loadComponent: () => import('./features/vehicle-management/vehicle-form/vehicle-form.page').then(m => m.VehicleFormPage)
  },
  {
    path: 'vehiculos/edit/:id',
    canActivate: [authGuard],
    data: { title: 'Editar Vehículo' },
    loadComponent: () => import('./features/vehicle-management/vehicle-form/vehicle-form.page').then(m => m.VehicleFormPage)
  },
  {
    path: 'route-form',
    canActivate: [authGuard],
    loadComponent: () => import('./features/route-management/route-form/route-form.page').then(m => m.RouteFormPage)
  },
  {
    path: 'vehicle-list',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/vehicle-list/vehicle-list.page').then(m => m.VehicleListPage)
  },
  {
    path: 'vehicle-form',
    canActivate: [authGuard],
    loadComponent: () => import('./features/vehicle-management/vehicle-form/vehicle-form.page').then(m => m.VehicleFormPage)
  },
  {
    path: 'asignacion-list',
    canActivate: [authGuard],
    loadComponent: () => import('./features/route-management/asignacion-list/asignacion-list.page').then(m => m.AsignacionListPage)
  },
  {
    path: 'asignaciones-recorrido/nueva',
    canActivate: [authGuard],
    loadComponent: () => import('./features/route-management/asignacion-form/asignacion-form.page').then(m => m.AsignacionFormPage)
  },
  {
    path: 'asignaciones-recorrido/editar/:idAsig',
    canActivate: [authGuard],
    loadComponent: () => import('./features/route-management/asignacion-form/asignacion-form.page').then(m => m.AsignacionFormPage)
  }, 
  {
    path: 'planificacion-list',
    canActivate: [authGuard],
    loadComponent: () => import('./features/maintenance/planificacion-list/planificacion-list.page').then(m => m.PlanificacionListPage)
  },
  {
    path: 'orden-trabajo-list',
    data: { title: 'Órdenes de Trabajo' },
    loadComponent: () => import('./features/maintenance/orden-trabajo-list/orden-trabajo-list.page').then(m => m.OrdenTrabajoListPage)
  },
  {
    path: 'orden-trabajo-detalle/:id',
    data: { title: 'Detalle de OT' },
    loadComponent: () => import('./features/maintenance/orden-trabajo-detalle/orden-trabajo-detalle.page').then(m => m.OrdenTrabajoDetallePage)
  },
  {
    path: 'gestion-usuarios',
    loadComponent: () => import('./features/user-management/gestion-usuarios/gestion-usuarios.page').then( m => m.GestionUsuariosPage),
    canActivate: [GestorGuard] 
  },
   
   {
    path: 'gestion-siniestros',
    loadComponent: () => import('./features/incident-management/gestion-siniestros/gestion-siniestros.page').then( m => m.GestionSiniestrosPage),
    canActivate: [GestorGuard] // <-- Añade el guard aquí también
  },
  {
    // --- MODIFICAR ESTA RUTA ---
    path: 'siniestro-detalle/:id', // Añadimos el parámetro :id
    loadComponent: () => import('./features/incident-management/siniestro-detalle/siniestro-detalle.page').then( m => m.SiniestroDetallePage),
    canActivate: [GestorGuard] // La protegemos con el mismo guard
  },{
  path: 'historial-vehiculo/:id', // La ruta espera el ID del vehículo
  loadComponent: () => import('./features/vehicle-management/historial-vehiculo/historial-vehiculo.page').then( m => m.HistorialVehiculoPage),
  canActivate: [authGuard, GestorGuard]
},
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  

  
  
  

];