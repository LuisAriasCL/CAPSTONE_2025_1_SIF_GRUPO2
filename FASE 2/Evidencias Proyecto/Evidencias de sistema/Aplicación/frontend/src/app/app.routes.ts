// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

import { SidebarComponent } from './componentes/sidebar/sidebar.component';

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

  // --- Rutas Privadas (dentro del contendio principal con menú) ---
  {
    path: '', // Ruta raíz para la sección autenticada
    component: SidebarComponent, // Carga el contenido con menú
    canActivate: [authGuard], // Protegido por el guardián
    children: [

      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.page').then( m => m.DashboardPage)
      },
      {
        path: 'recorridos',
        loadComponent: () => import('./pages/recorridos/recorridos.page').then((m) => m.HomePage) // Carga HomePage para /recorridos
      },
      {
        path: 'rutas',
        data: { title: 'Gestión de Rutas' },
        loadComponent: () => import('./pages/route-list/route-list.page').then( m => m.RouteListPage)
      },

      {
        path: 'rutas/nueva',
        data: { title: 'Nueva Ruta' },
        loadComponent: () => import('./pages/route-form/route-form.page').then( m => m.RouteFormPage)
      },
      {
        path: 'rutas/edit/:id',
        data: { title: 'Editar Ruta' },
        loadComponent: () => import('./pages/route-form/route-form.page').then( m => m.RouteFormPage)
      },
      {
        path: 'vehiculos', // Ruta para listar vehículos (debería ir a vehicle-list)
        data: { title: 'Vehículos' },
        loadComponent: () => import('./pages/vehicle-list/vehicle-list.page').then( m => m.VehicleListPage)
      },
      {
        path: 'vehiculos/new', // Ruta para crear vehículo nuevo
        data: { title: 'Nuevo Vehículo' },
        loadComponent: () => import('./pages/vehicle-form/vehicle-form.page').then( m => m.VehicleFormPage) // Carga VehicleFormPage
      },
      {
        path: 'vehiculos/edit/:id',
        data: { title: 'Editar Vehículo' },
        loadComponent: () => import('./pages/vehicle-form/vehicle-form.page').then( m => m.VehicleFormPage) // Carga VehicleFormPage
      },
      {
        path: 'route-form',
        loadComponent: () => import('./pages/route-form/route-form.page').then( m => m.RouteFormPage)
      },
      {
        path: 'vehicle-list',
        loadComponent: () => import('./pages/vehicle-list/vehicle-list.page').then( m => m.VehicleListPage)
      },
      {
        path: 'vehicle-form', 
        loadComponent: () => import('./pages/vehicle-form/vehicle-form.page').then( m => m.VehicleFormPage) // Carga VehicleFormPage
      },
      
      {
        path: 'asignacion-list', 
       
        loadComponent: () => import('./pages/asignacion-list/asignacion-list.page').then(m => m.AsignacionListPage)
      },
      {
        path: 'asignaciones-recorrido/nueva', 
        loadComponent: () => import('./pages/asignacion-form/asignacion-form.page').then(m => m.AsignacionFormPage)
      },
      {
        path: 'asignaciones-recorrido/editar/:idAsig', 

        loadComponent: () => import('./pages/asignacion-form/asignacion-form.page').then(m => m.AsignacionFormPage)
      },
      // Po
      {
        path: 'planificacion-form',
        loadComponent: () => import('./pages/maintenance/planificacion-form/planificacion-form.page').then( m => m.PlanificacionFormPage)
      },
      {
        path: 'planificacion-list',
        loadComponent: () => import('./pages/maintenance/planificacion-list/planificacion-list.page').then( m => m.PlanificacionListPage)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  
  
  
];