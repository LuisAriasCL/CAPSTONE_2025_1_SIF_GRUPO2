import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AppPage } from 'src/types/components.types';
import {
  IonList,
  IonMenuToggle,
  IonItem,
  IonIcon,
  IonLabel,
} from '@ionic/angular/standalone';



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

  //  Variables que recorrera AppPage en el HTML -*ngFor="let p of appPages"-
  public selectedIndex = 0;

  public appPages: AppPage[] = [
    { title: 'Dashboard', url: '/dashboard', icon: 'grid' },
    // { title: 'Reportes', url: '/reportes', icon: 'newspaper' }, // Página no existe aún
    { title: 'Mantenimientos', url: '/planificacion-list', icon: 'build' },
    // { title: 'Combustible', url: '/combustible', icon: 'flame' }, // Página no existe aún
    { title: 'Vehículos', url: '/vehiculos', icon: 'car' },
    // { title: 'Conductores', url: '/conductores', icon: 'people' }, // Página no existe aún
    { title: 'Asignación de recorridos', url: '/asignacion-list', icon: 'navigate' },
    // { title: 'Incidentes', url: '/siniestros', icon: 'warning' }, // Página no existe aún
    { title: 'Órdenes de Trabajo', url: '/orden-trabajo-list', icon: 'construct-outline' },
    { title: 'Gestión de Rutas', url: '/rutas', icon: 'map' },
    { title: 'Recorridos', url: '/recorridos', icon: 'navigate' },
  ];

}