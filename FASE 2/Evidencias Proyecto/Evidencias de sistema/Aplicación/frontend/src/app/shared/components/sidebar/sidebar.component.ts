import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonList,
  IonMenuToggle,
  IonItem,
  IonIcon,
  IonLabel,
  IonItemDivider,
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
  clipboardOutline
} from 'ionicons/icons';

import { AuthService } from 'src/app/core';


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
    IonItemDivider,
  ],
})
export class SidebarComponent {
 
  public selectedIndex = 0;
  /**
   * Opciones de navegación para la aplicación.
   */  public appPages = [
    { title: 'Dashboard', url: '/dashboard', icon: 'grid' },
    // { title: 'Reportes', url: '/reportes', icon: 'newspaper' }, // Página no existe aún
    { title: 'Mantenimientos', url: '/planificacion-list', icon: 'build' },
    // { title: 'Combustible', url: '/combustible', icon: 'flame' }, // Página no existe aún
    { title: 'Vehículos', url: '/vehiculos', icon: 'car' },
    // { title: 'Conductores', url: '/conductores', icon: 'people' }, // Página no existe aún
    { title: 'Asignación de recorridos', url: '/asignacion-list', icon: 'navigate' },
    // { title: 'Incidentes', url: '/siniestros', icon: 'warning' }, // Página no existe aún
    { title: 'Órdenes de Trabajo', url: '/orden-trabajo-list', icon: 'clipboard' },
    { title: 'Gestión de Rutas', url: '/rutas', icon: 'map' },
    { title: 'Recorridos', url: '/recorridos', icon: 'navigate' },
    { title: 'Gestión de Incidentes', url: '/gestion-siniestros', icon: 'warning' }
    
  ];
  public adminPages = [
    { title: 'Gestión de Usuarios', url: '/gestion-usuarios', icon: 'people-circle' }
  ];
  private authService = inject(AuthService);

  constructor() {

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
      clipboardOutline
    });
  }
   esRol(rol: 'admin' | 'gestor' | 'conductor' | 'mantenimiento' | 'tecnico'): boolean {
    const usuario = this.authService.getCurrentUser();
    return usuario ? usuario.rol === rol : false;
  }
}