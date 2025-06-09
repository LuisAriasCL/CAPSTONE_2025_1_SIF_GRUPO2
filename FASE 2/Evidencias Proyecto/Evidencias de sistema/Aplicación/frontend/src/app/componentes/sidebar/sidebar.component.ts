import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonList,
  IonMenuToggle,
  IonItem,
  IonIcon,
  IonLabel,
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
  businessOutline,
} from 'ionicons/icons';

import { AuthService } from '../../services/auth.service';

/**
 * Componente de navegación lateral.
 * Contiene solo la lista de navegación principal.
 */
@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonList,
    IonMenuToggle,
    IonItem,
    IonIcon,
    IonLabel,
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
    // { title: 'Reportes', url: '/reportes', icon: 'newspaper' }, // Página no existe aún
    { title: 'Mantenimientos', url: '/planificacion-list', icon: 'build' },
    // { title: 'Combustible', url: '/combustible', icon: 'flame' }, // Página no existe aún
    { title: 'Vehículos', url: '/vehiculos', icon: 'car' },
    // { title: 'Conductores', url: '/conductores', icon: 'people' }, // Página no existe aún
    { title: 'Asignación de recorridos', url: '/asignacion-list', icon: 'navigate' },
    // { title: 'Incidentes', url: '/siniestros', icon: 'warning' }, // Página no existe aún
    { title: 'Gestión de Rutas', url: '/rutas', icon: 'map' },
    { title: 'Recorridos', url: '/recorridos', icon: 'navigate' },
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
      businessOutline,
    });
  }
}