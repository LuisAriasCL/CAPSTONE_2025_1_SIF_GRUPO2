import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButton,
  IonIcon,
  IonPopover,
  IonList,
  IonItem,
  IonLabel,
  ModalController // Asegúrate de importar ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons'; // Necesario para los iconos
import { chevronDownOutline, personOutline, settingsOutline, logOutOutline } from 'ionicons/icons';
import { AlertaPersonalizadaComponent, AlertButton } from '../alerta-personalizada/alerta-personalizada.component'; // Ajusta la ruta
import { AuthService } from '../../services/auth.service'; 
@Component({
  selector: 'app-dropdown-usuario',
  templateUrl: './dropdown-usuario.component.html',
  styleUrls: ['./dropdown-usuario.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonIcon,
    IonPopover,
    IonList,
    IonItem,
    IonLabel
  ]
})
export class DropdownUsuarioComponent  {
  public currentUserName: string = 'Pedro San Martin';
  public showPopover = false;
  public popoverEvent: Event | null = null;

  constructor(
    private modalCtrl: ModalController,
    private router: Router,
    private authService: AuthService // Asegúrate de tener el servicio de autenticación
  ) {
    // Registra los iconos que usarás en este componente
    addIcons({ chevronDownOutline, personOutline, settingsOutline, logOutOutline });
  }

  openUserMenu(ev: Event): void {
    this.popoverEvent = ev;
    this.showPopover = true;
  }

  closePopover(): void {
    this.showPopover = false;
    this.popoverEvent = null; // Limpia el evento también
  }

  goToProfile(): void {
    console.log('Abrir perfil de usuario');
    this.router.navigate(['/perfil']); // Asegúrate que la ruta '/perfil' exista
    this.closePopover();
  }

  openSettings(): void {
    console.log('Abrir configuración');
    // Lógica para abrir configuración
    this.closePopover();
  }

  async mostrarAlertaLogout() {
    this.closePopover(); // Cierra el dropdown si está abierto

    const modal = await this.modalCtrl.create({
      component: AlertaPersonalizadaComponent,
      componentProps: {
        title: 'Confirmar cierre de sesión',
        message: '¿Estás seguro que deseas cerrar sesión?',
        icon: 'warning', // 'warning', 'success', 'error', 'info'
        buttons: [
          { text: 'Cancelar', role: 'cancel', cssClass: 'button-cancel' }, // Botón gris/claro
          { text: 'Cerrar sesión', role: 'confirm', cssClass: 'button-danger' } // Botón rojo
        ] as AlertButton[] // Asegura el tipo
      },
      cssClass: 'custom-alert-modal-wrapper', // Clase para el backdrop y posicionamiento
      backdropDismiss: false // Evita cerrar al hacer clic fuera
    });

    await modal.present();

    // Espera el resultado al cerrar el modal
    const { data } = await modal.onDidDismiss();

    if (data === 'confirm') {
      console.log('Cerrando sesión...');
      // Aquí tu lógica de logout
      this.mostrarAlertaExito(); // Muestra alerta de éxito
    } else {
      console.log('Cierre de sesión cancelado (role:', data, ')');
    }
  }

  async mostrarAlertaExito() {
    const modal = await this.modalCtrl.create({
      component: AlertaPersonalizadaComponent,
      componentProps: {
        title: 'Sesión cerrada',
        message: 'Su sesión fue cerrada con éxito.',
        icon: 'success',
        buttons: [
          { text: 'Aceptar', role: 'accept' }
        ] as AlertButton[]
      },
      // Añadimos una clase específica para este modal
      cssClass: 'custom-alert-modal-wrapper logout-success-modal-wrapper',
      backdropDismiss: false
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data === 'accept') {
      this.router.navigate(['/login']); // Redirige
    }
  }

  logout(): void {
    this.mostrarAlertaLogout();
    this.authService.logout();
  }
}
