import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef,
  Input,
} from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { IonicModule, ToastController, ModalController } from '@ionic/angular';
import { ApiService, Siniestro } from '../../services/api.service';
import { AlertaPersonalizadaComponent } from '../../componentes/alerta-personalizada/alerta-personalizada.component';

@Component({
  selector: 'app-siniestro-detalle',
  templateUrl: './siniestro-detalle.page.html',
  styleUrls: ['./siniestro-detalle.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, DatePipe, TitleCasePipe],
})
export class SiniestroDetallePage implements OnInit {
  @Input() siniestroId!: number;

  public siniestro: Siniestro | null = null;
  public cargando = true;
  public readonly apiUrl = 'http://localhost:8101';

  private apiService = inject(ApiService);
  private toastCtrl = inject(ToastController);
  private modalCtrl = inject(ModalController);
  private cdr = inject(ChangeDetectorRef);

  constructor() {}

  ngOnInit() {
    this.cargarDetalleSiniestro();
  }

  cargarDetalleSiniestro() {
    this.cargando = true;

    if (!this.siniestroId) {
      this.closeModal();
      return;
    }

    this.apiService.getSiniestroById(this.siniestroId).subscribe({
      next: (data) => {
        this.siniestro = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargando = false;
        this.mostrarToast(
          'No se pudo cargar la información del incidente.',
          'danger'
        );
        this.closeModal();
      },
    });
  }
  async actualizarEstado() {
    if (!this.siniestro) return;

    const estadosPosibles = ['en_revision', 'resuelto', 'cancelado'];

    // Crear mensaje con opciones de estado
    const opcionesHtml = estadosPosibles
      .map(
        (estado, index) =>
          `<div style="margin: 8px 0;">
        <label style="display: flex; align-items: center; cursor: pointer;">
          <input type="radio" name="estado" value="${estado}" ${
            this.siniestro?.estado === estado ? 'checked' : ''
          } style="margin-right: 8px;">
          ${estado
            .replace('_', ' ')
            .replace(/\b\w/g, (l: string) => l.toUpperCase())}
        </label>
      </div>`
      )
      .join('');

    const confirmModal = await this.modalCtrl.create({
      component: AlertaPersonalizadaComponent,
      componentProps: {
        title: 'Actualizar Estado',
        message: `Selecciona el nuevo estado para este incidente:<div style="margin-top: 16px;">${opcionesHtml}</div>`,
        icon: 'settings',
        buttons: [
          { text: 'Cancelar', role: 'cancel', cssClass: 'button-cancel' },
          { text: 'Actualizar', role: 'confirm', cssClass: 'confirm-button' },
        ],
      },
      backdropDismiss: false,
      cssClass: 'custom-alert-modal',
    });

    await confirmModal.present();
    const { data } = await confirmModal.onDidDismiss();

    if (data === 'confirm') {
      // Obtener el valor seleccionado del DOM
      const modalElement = document.querySelector('app-alerta-personalizada');
      const selectedRadio = modalElement?.querySelector(
        'input[name="estado"]:checked'
      ) as HTMLInputElement;
      const nuevoEstado = selectedRadio?.value;

      if (nuevoEstado && this.siniestro) {
        this.apiService
          .updateSiniestroStatus(this.siniestro.id, nuevoEstado)
          .subscribe({
            next: () => {
              this.mostrarToast('Estado actualizado con éxito.', 'success');
              if (this.siniestro) {
                this.siniestro.estado = nuevoEstado;
                this.cdr.detectChanges();
              }
            },
            error: (err) =>
              this.mostrarToast('Error al actualizar el estado.', 'danger'),
          });
      }
    }
  }

  getColorForStatus(estado: string | undefined): string {
    if (!estado) return 'light';
    switch (estado) {
      case 'reportado':
        return 'warning';
      case 'en_revision':
        return 'primary';
      case 'resuelto':
        return 'success';
      case 'cancelado':
        return 'medium';
      default:
        return 'light';
    }
  }

  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 3000,
      color: color,
    });
    toast.present();
  }

  async closeModal(data?: any) {
    await this.modalCtrl.dismiss(data);
  }
}
