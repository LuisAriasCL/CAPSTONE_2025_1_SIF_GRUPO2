// src/app/componentes/sidebar/sidebar.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router'; 
import {  IonSplitPane, IonMenu, IonContent, IonList, IonListHeader, IonNote, IonMenuToggle, IonItem, IonIcon, IonLabel, IonRouterOutlet, IonHeader, IonToolbar, IonTitle, IonButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { gridOutline, carOutline, logOutOutline, documentsOutline, peopleOutline, mapOutline, constructOutline, settingsOutline, warningOutline, listOutline, buildOutline, newspaperOutline, checkboxOutline, exitOutline, readerOutline, flameOutline, briefcaseOutline, documentOutline, alarmOutline } from 'ionicons/icons';

import { AuthService } from '../../services/auth.service'; 

@Component({
  selector: 'app-sidebar-layout', 
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [
    CommonModule, RouterLink, // RouterOutlet es importante aquí
IonSplitPane, IonMenu, IonContent, IonList, IonMenuToggle, IonItem, IonIcon, IonLabel, IonRouterOutlet, IonHeader, IonToolbar, IonTitle,
   ], 
})
export class sidebarComponent { 
  private authService = inject(AuthService);

  public appPages = [
    { title: 'Dashboard', url: '/dashboard', icon: 'grid' },
    { title: 'Reportes', url: '/reportes', icon: 'newspaper' },
    { title: 'Mantenimientos', url: '/mantenimiento', icon: 'build' },
    { title: 'Combustible', url: '/combustible', icon: 'flame' },
    { title: 'Checklists', url: '/checklists', icon: 'checkbox' },
    { title: 'Vehículos', url: '/vehiculos', icon: 'car' },
    { title: 'Proyectos', url: '/proyectos', icon: 'briefcase' },
    { title: 'Conductores', url: '/conductores', icon: 'people' },
    { title: 'Recorridos', url: '/recorridos', icon: 'map' },
    { title: 'Documentos', url: '/documentos', icon: 'document' },
    { title: 'Recordatorios', url: '/recordatorios', icon: 'alarm' },
    { title: 'Siniestros', url: '/siniestros', icon: 'warning' },
  ];
  public selectedIndex = 0;

  constructor() {
    addIcons({ gridOutline, carOutline, logOutOutline, documentsOutline, peopleOutline, mapOutline, constructOutline, settingsOutline, warningOutline, listOutline, buildOutline, newspaperOutline, checkboxOutline, exitOutline, readerOutline, flameOutline, briefcaseOutline, documentOutline, alarmOutline });
  }

  logout() {
    console.log("sidebarLayout: Logout llamado");
    this.authService.logout();
  }
}