import { Component, Input, OnInit, OnDestroy } from '@angular/core';
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
  ModalController,
} from '@ionic/angular/standalone';
import { AlertaPersonalizadaComponent } from '../alerta-personalizada/alerta-personalizada.component';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { AlertButton } from 'src/types/components.types';
import { AlertIconType } from 'src/types/components.types';

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
    IonLabel,
  ],
})
export class DropdownUsuarioComponent {
  @Input() userNameFromHeader?: string; // Opción 1: Recibir del header

  public currentUserNameDisplay: string = ''; // Para mostrar en el template
  public showPopover = false;
  public popoverEvent: Event | null = null;
  private userSubscription!: Subscription;

  // Botones de alerta personalizados para el modal de cierre de sesión
  private readonly logoutButtons: AlertButton[] = [
    { text: 'Cancelar', role: 'cancel', variant: 'secondary' },
    { text: 'Si, cerrar sesión', role: 'confirm', variant: 'danger' },
  ];

  constructor(
    private modalCtrl: ModalController,
    private router: Router,
    private authService: AuthService
  ) {}

  openUserMenu(event: Event): void {
    this.popoverEvent = event;
    this.showPopover = true;
  }

  closePopover(): void {
    this.showPopover = false;
    this.popoverEvent = null;
  }

  goToProfile(): void {
    this.router.navigate(['/perfil']);
    this.closePopover();
  }

  openSettings(): void {
    this.closePopover();
  }

  // Método para crear el modal de cierre de sesión
  private async crearModalLogout() {
    return this.modalCtrl.create({
      component: AlertaPersonalizadaComponent,
      componentProps: {
        title: 'Cerrar sesión',
        message: '¿Estás seguro que deseas cerrar sesión?',
        icon: AlertIconType.Logout,
        buttons: this.logoutButtons,
      },
      cssClass: 'custom-alert-modal',
      backdropDismiss: false,
    });
  }

  // Método para manejar el resultado del modal de cierre de sesión
  private manejarResultadoLogout(data: any) {
    const actions: Record<string, () => void> = {
      confirm: () => this.authService.logout(),
      cancel: () => this.closePopover(),
    };
    actions[data]?.();
  }

  // METODO PARA MOSTRAR LA ALERTA DE CIERRE DE SESIÓN.

  async mostrarAlertaLogout() {
    this.closePopover(); // Asegurarse de que el popover se cierre
    const modal = await this.crearModalLogout();
    await modal.present();
    const { data } = await modal.onDidDismiss();
    this.manejarResultadoLogout(data);
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
  }
}
