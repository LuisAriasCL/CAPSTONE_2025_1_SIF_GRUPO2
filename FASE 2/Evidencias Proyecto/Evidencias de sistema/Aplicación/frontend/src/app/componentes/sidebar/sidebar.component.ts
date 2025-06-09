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
  listOutline 
} from 'ionicons/icons';

import { AuthService } from '../../services/auth.service';


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
 
  public selectedIndex = 0;


  public appPages = [
    { title: 'Dashboard', url: '/dashboard', icon: 'grid' },
    { title: 'Reportes', url: '/reportes', icon: 'newspaper' },
    { title: 'Planes de Mnt.', url: '/planificacion-list', icon: 'build' },
  
    { title: 'Órdenes de Trabajo', url: '/orden-trabajo-list', icon: 'list' },
   
    { title: 'Combustible', url: '/combustible', icon: 'flame' },
    { title: 'Vehículos', url: '/vehiculos', icon: 'car' },
    { title: 'Conductores', url: '/conductores', icon: 'people' },
    { title: 'Asignación de recorridos', url: '/asignacion-list', icon: 'navigate' },
    { title: 'Incidentes', url: '/siniestros', icon: 'warning' },
    { title: 'Gestión de Rutas', url: '/rutas', icon: 'map' },
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
      listOutline 
    });
  }
}