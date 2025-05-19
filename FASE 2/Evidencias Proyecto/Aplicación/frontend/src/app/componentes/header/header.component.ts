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
import { DropdownUsuarioComponent } from '../dropdown-usuario/dropdown-usuario.component';
import { IconoAlertaComponent } from "../icono-alerta/icono-alerta.component";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    DropdownUsuarioComponent,
    IconoAlertaComponent
],
})
export class HeaderComponent implements OnInit {
  // Título fijo para el header.
  public currentPageTitle: string = 'Sistema Integral de Flota';
  // Nombre del usuario actual.
  public currentUserName: string = 'Pedro San Martin';
  // Cantidad de notificaciones
  public notificationCount: number = 5; // Cambia este valor para probar


  constructor(private router: Router) {}

  ngOnInit(): void {
    // Aquí se podría agregar lógica adicional si fuese necesario.
  }

  
}