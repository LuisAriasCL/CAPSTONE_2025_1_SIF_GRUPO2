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
      // Rutas hijas que se renderizan DENTRO de MainComponent
      {
        path: 'dashboard', // Ruta: /dashboard
        loadComponent: () => import('./pages/dashboard/dashboard.page').then( m => m.DashboardPage)
      },
      {
        path: 'recorridos', // Ruta: /home (mapa)
        loadComponent: () => import('./pages/recorridos/recorridos.page').then((m) => m.HomePage)
      },
      {
        path: 'rutas', // Lista de rutas (ya existe)
        data: { title: 'Gestión de Rutas' },
        loadComponent: () => import('./pages/route-list/route-list.page').then( m => m.RouteListPage)
      },
      // --- AÑADIR RUTAS PARA CREAR Y EDITAR ---
      {
        path: 'rutas/new', // Ruta para crear
        data: { title: 'Nueva Ruta' }, // Título para el header
        loadComponent: () => import('./pages/route-form/route-form.page').then( m => m.RouteFormPage)
      },
      {
        path: 'rutas/edit/:id', // Ruta para editar (con parámetro id)
        data: { title: 'Editar Ruta' }, // Título para el header
        loadComponent: () => import('./pages/route-form/route-form.page').then( m => m.RouteFormPage)
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
  
    

  // --- Ruta Wildcard (opcional, para 404) ---
  // Debe ir al final
  // { path: '**', redirectTo: 'login' } // O a una página 404 dedicada
];