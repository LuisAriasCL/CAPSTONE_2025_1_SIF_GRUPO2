// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard'; 

import { sidebarComponent } from './componentes/sidebar/sidebar.component';

export const routes: Routes = [
  // --- Rutas Públicas (fuera del layout principal) ---
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
    component: sidebarComponent, // Carga el contenido con menú
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
      // --- Añadir aquí las otras rutas del menú ---
      // {
      //   path: 'vehiculos', // Ruta: /vehicles (ejemplo)
      //   loadComponent: () => import('./pages/vehicles/vehicles.page').then( m => m.VehiclesPage)
      // },
      // {
      //   path: 'conductores', // Ruta: /drivers (ejemplo)
      //   loadComponent: () => import('./pages/drivers/drivers.page').then( m => m.DriversPage)
      // },
      // ... etc ...

      // Redirección por defecto DENTRO del layout autenticado
      // Si el usuario va a "/" (después de login), redirige a "/dashboard"
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  // --- Ruta Wildcard (opcional, para 404) ---
  // Debe ir al final
  // { path: '**', redirectTo: 'login' } // O a una página 404 dedicada
];