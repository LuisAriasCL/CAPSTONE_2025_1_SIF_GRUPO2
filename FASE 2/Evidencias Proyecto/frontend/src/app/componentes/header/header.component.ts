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
  IonTitle,
  IonButton,
  IonButtons,
  IonPopover
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
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
    IonTitle,
    IonButton,
    IonButtons,
    IonPopover
  ],
})
export class HeaderComponent implements OnInit {
  // Título fijo para el header.
  public currentPageTitle: string = 'Sistema Integral de Flota';
  // Nombre del usuario actual.
  public currentUserName: string = 'Pedro San Martin';

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Aquí se podría agregar lógica adicional si fuese necesario.
  }

  /**
   * Muestra el perfil del usuario.
   */
  onProfile(): void {
    console.log('Abriendo perfil de usuario');
    // Lógica para abrir el perfil (p. ej., navegar a la página de perfil)
  }

  /**
   * Muestra la configuración.
   */
  onSettings(): void {
    console.log('Abriendo configuración');
    // Lógica para abrir la configuración
  }

  /**
   * Cierra la sesión del usuario.
   */
  logout(): void {
    console.log('Cerrando sesión');
    // Lógica de logout
  }
}