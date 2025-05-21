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
        loadComponent: () => import('./pages/recorridos/recorridos.page').then((m) => m.HomePage)
      },
      {
        path: 'rutas', 
        data: { title: 'Gestión de Rutas' },
        loadComponent: () => import('./pages/route-list/route-list.page').then( m => m.RouteListPage)
      },
      
      {
        path: 'rutas/new', 
        data: { title: 'Nueva Ruta' }, 
        loadComponent: () => import('./pages/route-form/route-form.page').then( m => m.RouteFormPage)
      },
      {
        path: 'rutas/edit/:id', 
        data: { title: 'Editar Ruta' }, 
        loadComponent: () => import('./pages/route-form/route-form.page').then( m => m.RouteFormPage)
      },
      {
        path: 'vehiculos', 
        data: { title: 'Vehículos' }, 
        loadComponent: () => import('./pages/vehicle-list/vehicle-list.page').then( m => m.VehicleListPage)
      },
      {
        path: 'vehiculos/new', // Ruta para crear vehículo nuevo
        data: { title: 'Nuevo Vehículo' }, 
        loadComponent: () => import('./pages/vehicle-form/vehicle-form.page').then( m => m.VehicleFormPage)
      },
      {
        path: 'vehiculos/edit/:id', 
        data: { title: 'Editar Vehículo' }, 
        loadComponent: () => import('./pages/vehicle-form/vehicle-form.page').then( m => m.VehicleFormPage)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
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
    loadComponent: () => import('./pages/vehicle-form/vehicle-form.page').then( m => m.VehicleFormPage)
  },
  
    

  // --- Ruta Wildcard (opcional, para 404) ---
  // Debe ir al final
  // { path: '**', redirectTo: 'login' } // O a una página 404 dedicada
];