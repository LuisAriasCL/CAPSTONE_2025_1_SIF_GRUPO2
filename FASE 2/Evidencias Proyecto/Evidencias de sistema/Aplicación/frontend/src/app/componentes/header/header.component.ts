import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon,
  IonMenuToggle
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { addIcons } from 'ionicons';
import { menuOutline } from 'ionicons/icons';
import { DropdownUsuarioComponent } from '../dropdown-usuario/dropdown-usuario.component';
import { IconoAlertaComponent } from "../icono-alerta/icono-alerta.component";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonIcon,
    IonMenuToggle,
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


  constructor(private router: Router) {
    // Registrar íconos necesarios
    addIcons({
      menuOutline
    });
  }

  ngOnInit(): void {
    // Aquí se podría agregar lógica adicional si fuese necesario.
  }

  
}