import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { closeOutline, warningOutline } from 'ionicons/icons';

@Component({
  selector: 'app-rechazo-ot-modal',
  templateUrl: './rechazo-ot-modal.component.html',
  styleUrls: ['./rechazo-ot-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class RechazoOtModalComponent {
  @Input() ordenTrabajo?: any;

  motivoRechazo: string = '';
  isSubmitting: boolean = false;

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController
  ) {
    addIcons({
      closeOutline,
      warningOutline,
    });
  }

  async confirmarRechazo() {
    if (!this.motivoRechazo || this.motivoRechazo.trim().length === 0) {
      this.mostrarToast('El motivo del rechazo es obligatorio', 'warning');
      return;
    }

    if (this.motivoRechazo.trim().length < 10) {
      this.mostrarToast('El motivo debe tener al menos 10 caracteres', 'warning');
      return;
    }

    this.isSubmitting = true;

    try {
      await this.modalCtrl.dismiss({
        rechazado: true,
        motivo: this.motivoRechazo.trim(),
      });
    } catch (error) {
      console.error('Error al confirmar rechazo:', error);
      this.mostrarToast('Error al procesar el rechazo', 'danger');
    } finally {
      this.isSubmitting = false;
    }
  }

  async cancelar() {
    await this.modalCtrl.dismiss({
      rechazado: false,
    });
  }

  private async mostrarToast(mensaje: string, color: string = 'dark') {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 3000,
      color: color,
      position: 'bottom',
    });
    await toast.present();
  }
}
