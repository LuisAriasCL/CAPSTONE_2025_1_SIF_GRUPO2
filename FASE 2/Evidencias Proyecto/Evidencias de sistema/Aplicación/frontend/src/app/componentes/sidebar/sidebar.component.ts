import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonSplitPane,
  IonMenu,
  IonContent,
  IonList,
  IonMenuToggle,
  IonItem,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  gridOutline,
  newspaperOutline,
  buildOutline,
  flameOutline,
  carOutline,
  peopleOutline,
  navigateOutline,
  warningOutline,
  mapOutline,
} from 'ionicons/icons';

import { AuthService } from '../../services/auth.service';

/**
 * Componente principal del menú lateral y contenido principal.
 * Maneja la navegación y el cierre de sesión.
 */
@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonSplitPane,
    IonMenu,
    IonContent,
    IonList,
    IonMenuToggle,
    IonItem,
    IonIcon,
    IonLabel,
    IonRouterOutlet,
  ],
})
export class SidebarComponent {
  /**
   * Índice del elemento de menú seleccionado.
   */
  public selectedIndex = 0;

  /**
   * Opciones de navegación para la aplicación.
   */
  public appPages = [
    { title: 'Dashboard', url: '/dashboard', icon: 'grid' },
    { title: 'Reportes', url: '/reportes', icon: 'newspaper' },
    { title: 'Mantenimientos', url: '/planificacion-list', icon: 'build' },
    { title: 'Combustible', url: '/combustible', icon: 'flame' },
    { title: 'Vehículos', url: '/vehiculos', icon: 'car' },
    { title: 'Conductores', url: '/conductores', icon: 'people' },
    { title: 'Asignación de recorridos', url: '/asignacion-list', icon: 'navigate' },
    { title: 'Incidentes', url: '/siniestros', icon: 'warning' },
    { title: 'Gestión de Rutas', url: '/rutas', icon: 'map' },
  ];

  private authService = inject(AuthService);

  constructor() {
    // Registro de íconos Ionicons personalizados
    addIcons({
      gridOutline,
      newspaperOutline,
      buildOutline,
      flameOutline,
      carOutline,
      peopleOutline,
      navigateOutline,
      warningOutline,
      mapOutline,
    });
  }
}