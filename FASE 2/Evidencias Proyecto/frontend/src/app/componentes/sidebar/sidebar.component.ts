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
  IonHeader,
  IonToolbar,
  IonTitle
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  gridOutline,
  carOutline,
  logOutOutline,
  documentsOutline,
  peopleOutline,
  mapOutline,
  constructOutline,
  settingsOutline,
  warningOutline,
  listOutline,
  buildOutline,
  newspaperOutline,
  checkboxOutline,
  exitOutline,
  readerOutline,
  flameOutline,
  briefcaseOutline,
  documentOutline,
  alarmOutline
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
    IonHeader,
    IonToolbar,
    IonTitle
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
    { title: 'Dashboard',      url: '/dashboard',     icon: 'grid' },
    { title: 'Reportes',       url: '/reportes',      icon: 'newspaper' },
    { title: 'Mantenimientos', url: '/mantenimiento', icon: 'build' },
    { title: 'Combustible',    url: '/combustible',   icon: 'flame' },
    { title: 'Checklists',     url: '/checklists',    icon: 'checkbox' },
    { title: 'Vehículos',      url: '/vehiculos',     icon: 'car' },
    { title: 'Proyectos',      url: '/proyectos',     icon: 'briefcase' },
    { title: 'Conductores',    url: '/conductores',   icon: 'people' },
    { title: 'Recorridos',     url: '/recorridos',    icon: 'map' },
    { title: 'Documentos',     url: '/documentos',    icon: 'document' },
    { title: 'Recordatorios',  url: '/recordatorios', icon: 'alarm' },
    { title: 'Siniestros',     url: '/siniestros',    icon: 'warning' },
  ];

  private authService = inject(AuthService);

  constructor() {
    // Registro de íconos Ionicons personalizados
    addIcons({
      gridOutline,
      carOutline,
      logOutOutline,
      documentsOutline,
      peopleOutline,
      mapOutline,
      constructOutline,
      settingsOutline,
      warningOutline,
      listOutline,
      buildOutline,
      newspaperOutline,
      checkboxOutline,
      exitOutline,
      readerOutline,
      flameOutline,
      briefcaseOutline,
      documentOutline,
      alarmOutline
    });
  }

  /**
   * Llama al servicio de autenticación para cerrar sesión.
   */
  logout(): void {
    console.log('SidebarComponent: logout() invocado');
    this.authService.logout();
  }
}