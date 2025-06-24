import { Component, OnInit, inject } from '@angular/core';
import {
  CommonModule,
  DatePipe,
  TitleCasePipe,
  SlicePipe,
} from '@angular/common';
import { IonicModule, ToastController, ModalController } from '@ionic/angular';
import { ApiService, Siniestro } from '../../services/api.service';
import { HeaderComponent } from 'src/app/componentes/header/header.component';
import { SiniestroDetallePage } from '../siniestro-detalle/siniestro-detalle.page';

@Component({
  selector: 'app-gestion-siniestros',
  templateUrl: './gestion-siniestros.page.html',
  styleUrls: ['./gestion-siniestros.page.scss'],
  standalone: true,

  imports: [
    IonicModule,
    CommonModule,
    HeaderComponent,
    DatePipe,
    TitleCasePipe,
    SlicePipe,
  ],
})
export class GestionSiniestrosPage implements OnInit {
  public siniestros: Siniestro[] = [];
  public cargando = true;
  public skeletonItems = Array(5);

  private apiService = inject(ApiService);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);

  constructor() {}

  ngOnInit() {}

  ionViewWillEnter() {
    this.cargarSiniestros();
  }

  cargarSiniestros() {
    this.cargando = true;
    console.log('[Gestión Siniestros] Iniciando carga de datos...');

    this.apiService.getSiniestros().subscribe({
      next: (data) => {
        console.log('[Gestión Siniestros] Datos recibidos del backend:', data);
        this.siniestros = data;
        this.cargando = false;
        console.log(
          `[Gestión Siniestros] Carga finalizada. Se recibieron ${data.length} registros.`
        );
      },
      error: (err) => {
        console.error(
          '[Gestión Siniestros] ¡ERROR! La petición al API falló:',
          err
        );
        this.cargando = false;
        this.mostrarToast('Error al cargar los incidentes.', 'danger');
      },
    });
  }

  async verDetalles(id: number | undefined) {
    if (!id) {
      console.error(
        'No se puede abrir el modal, el ID del siniestro es indefinido.'
      );
      return;
    }

    const modal = await this.modalCtrl.create({
      component: SiniestroDetallePage,
      componentProps: {
        siniestroId: id,
      },
      cssClass: 'siniestro-detalle-modal',
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    // Si es necesario, recargar la lista después de cerrar el modal
    if (data && data.refresh) {
      this.cargarSiniestros();
    }
  }

  getColorForStatus(estado: string): string {
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
}
