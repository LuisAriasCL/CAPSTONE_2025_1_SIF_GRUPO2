// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  // --- Rutas Públicas (fuera del sidebar principal) ---
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then( m => m.RegisterPage)
  },

  // --- Rutas Privadas (protegidas por authGuard) ---
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard/dashboard.page').then( m => m.DashboardPage)
  },
  {
    path: 'recorridos',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/recorridos/recorridos.page').then((m) => m.HomePage) // Carga HomePage para /recorridos
  },
  {
    path: 'rutas',
    canActivate: [authGuard],
    data: { title: 'Gestión de Rutas' },
    loadComponent: () => import('./pages/route-list/route-list.page').then( m => m.RouteListPage)
  },
  {
    path: 'rutas/nueva',
    canActivate: [authGuard],
    data: { title: 'Nueva Ruta' },
    loadComponent: () => import('./pages/route-form/route-form.page').then( m => m.RouteFormPage)
  },
  {
    path: 'rutas/edit/:id',
    canActivate: [authGuard],
    data: { title: 'Editar Ruta' },
    loadComponent: () => import('./pages/route-form/route-form.page').then( m => m.RouteFormPage)
  },
  {
    path: 'vehiculos', // Ruta para listar vehículos (debería ir a vehicle-list)
    canActivate: [authGuard],
    data: { title: 'Vehículos' },
    loadComponent: () => import('./pages/vehicle-list/vehicle-list.page').then( m => m.VehicleListPage)
  },
  {
    path: 'vehiculos/new', // Ruta para crear vehículo nuevo
    canActivate: [authGuard],
    data: { title: 'Nuevo Vehículo' },
    loadComponent: () => import('./pages/vehicle-form/vehicle-form.page').then( m => m.VehicleFormPage) // Carga VehicleFormPage
  },
  {
    path: 'vehiculos/edit/:id',
    canActivate: [authGuard],
    data: { title: 'Editar Vehículo' },
    loadComponent: () => import('./pages/vehicle-form/vehicle-form.page').then( m => m.VehicleFormPage) // Carga VehicleFormPage
  },
  {
    path: 'route-form',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/route-form/route-form.page').then( m => m.RouteFormPage)
  },
  {
    path: 'vehicle-list',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/vehicle-list/vehicle-list.page').then( m => m.VehicleListPage)
  },
  {
    path: 'vehicle-form',
    canActivate: [authGuard], 
    loadComponent: () => import('./pages/vehicle-form/vehicle-form.page').then( m => m.VehicleFormPage) // Carga VehicleFormPage
  },
  {
    path: 'asignacion-list',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/asignacion-list/asignacion-list.page').then(m => m.AsignacionListPage)
  },
  {
    path: 'asignaciones-recorrido/nueva',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/asignacion-form/asignacion-form.page').then(m => m.AsignacionFormPage)
  },
  {
    path: 'asignaciones-recorrido/editar/:idAsig',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/asignacion-form/asignacion-form.page').then(m => m.AsignacionFormPage)
  },
  {
    path: 'planificacion-form',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/maintenance/planificacion-form/planificacion-form.page').then( m => m.PlanificacionFormPage)
  },  {
    path: 'planificacion-list',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/maintenance/planificacion-list/planificacion-list.page').then( m => m.PlanificacionListPage)
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];