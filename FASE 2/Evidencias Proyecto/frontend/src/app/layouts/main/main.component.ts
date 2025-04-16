// src/app/layouts/main/main.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router'; 
import { IonApp, IonSplitPane, IonMenu, IonContent, IonList, IonListHeader, IonNote, IonMenuToggle, IonItem, IonIcon, IonLabel, IonRouterOutlet, IonHeader, IonToolbar, IonTitle, IonButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { gridOutline, carOutline, logOutOutline, documentsOutline, peopleOutline, mapOutline, constructOutline, settingsOutline, warningOutline, listOutline, buildOutline, newspaperOutline, checkboxOutline, exitOutline, readerOutline } from 'ionicons/icons';

import { AuthService } from '../../services/auth.service'; 

@Component({
  selector: 'app-main-layout', 
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  standalone: true,
  imports: [
    CommonModule, RouterLink, RouterLinkActive, RouterOutlet, // RouterOutlet es importante aquí
    IonApp, IonSplitPane, IonMenu, IonContent, IonList, IonListHeader, IonNote, IonMenuToggle, IonItem, IonIcon, IonLabel, IonRouterOutlet, IonHeader, IonToolbar, IonTitle, IonButton
   ],
})
export class MainComponent { 
  private authService = inject(AuthService);

  public appPages = [
    { title: 'Dashboard', url: '/dashboard', icon: 'grid' },
    { title: 'Vehículos', url: '/home', icon: 'car' }, // Apunta a /home (mapa) por ahora
    { title: 'Conductores', url: '/drivers', icon: 'people' },
    { title: 'Recorridos', url: '/recorridos', icon: 'map' },
    { title: 'Mantenimientos', url: '/mantenimiento', icon: 'build' },
    { title: 'Reportes', url: '/reportes', icon: 'newspaper' },
  ];
  public selectedIndex = 0;

  constructor() {
    addIcons({ gridOutline, carOutline, logOutOutline, documentsOutline, peopleOutline, mapOutline, constructOutline, settingsOutline, warningOutline, listOutline, buildOutline, newspaperOutline, checkboxOutline, exitOutline, readerOutline });
  }

  logout() {
    console.log("MainLayout: Logout llamado");
    this.authService.logout();
  }
}