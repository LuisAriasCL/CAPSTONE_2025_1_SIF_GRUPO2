import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, LoadingController, ToastController, AlertController, ModalController } from '@ionic/angular';
import { ApiService, OrdenTrabajoResumen } from 'src/app/services/api.service';
import { AlertaPersonalizadaComponent } from '../../../componentes/alerta-personalizada/alerta-personalizada.component';
import { OrdenTrabajoDetallePage } from '../orden-trabajo-detalle/orden-trabajo-detalle.page';

@Component({
  selector: 'app-orden-trabajo-list',
  templateUrl: './orden-trabajo-list.page.html',
  styleUrls: ['./orden-trabajo-list.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, DatePipe]
})
export class OrdenTrabajoListPage implements OnInit {

  ordenes: OrdenTrabajoResumen[] = [];
  isLoading: boolean = false;

  constructor(
    private apiService: ApiService,
    private navCtrl: NavController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private modalController: ModalController
  ) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.cargarOrdenes();
  }

  async cargarOrdenes(event?: any) {
    if (!event) {
      this.isLoading = true;
    }

    this.apiService.getOrdenesTrabajo().subscribe({
      next: (data) => {
        this.ordenes = data;
        this.isLoading = false;
        if (event) {
          event.target.complete();
        }
      },
      error: async (error) => {
        console.error('Error al cargar las órdenes de trabajo', error);
        this.isLoading = false;
        if (event) {
          event.target.complete();
        }
        
        // Mostrar alerta personalizada en caso de error
        const modal = await this.modalController.create({
          component: AlertaPersonalizadaComponent,
          componentProps: {
            title: 'Error',
            message: 'No se pudo cargar la lista de órdenes de trabajo. ' + (error.message || 'Inténtelo nuevamente.'),
            icon: 'error',
            buttons: [{ text: 'Aceptar', role: 'confirm' }]
          },
          cssClass: 'custom-alert-modal'
        });
        await modal.present();
      }
    });
  }

  async verDetalle(idOt: number) {
    // En lugar de navegar a otra página, abrir un modal
    const modal = await this.modalController.create({
      component: OrdenTrabajoDetallePage,
      componentProps: {
        ordenTrabajoId: idOt
      },
      cssClass: 'orden-trabajo-modal',
      backdropDismiss: false
    });

    await modal.present();

    // Manejar el cierre del modal
    const { data } = await modal.onDidDismiss();
    if (data && data.updated) {
      this.cargarOrdenes(); // Recargar la lista si se actualizó algo
    }
  }

  getIconForStatus(estado: string): string {
    switch (estado) {
      case 'completado':
        return 'checkmark-circle-outline';
      case 'en_progreso':
        return 'sync-circle-outline';
      case 'solicitado':
        return 'help-circle-outline';
      case 'cancelado':
        return 'close-circle-outline';
      default:
        return 'ellipse-outline';
    }
  }

  getColorForStatus(estado: string): string {
    switch (estado) {
      case 'completado':
        return 'success';
      case 'en_progreso':
        return 'warning';
      case 'solicitado':
        return 'primary';
      case 'cancelado':
        return 'danger';
      default:
        return 'medium';
    }
  }

  // Función para mostrar los estados en formato legible
  getStatusDisplayName(estado: string | undefined): string {
    if (!estado) return 'Sin estado';
    
    const estadosDisplay: { [key: string]: string } = {
      solicitado: 'Solicitado',
      en_progreso: 'En Progreso',
      completado: 'Completado',
      cancelado: 'Cancelado'
    };
    
    return estadosDisplay[estado] || estado;
  }

  // Método para validar fechas antes de aplicar el pipe date
  isValidDate(dateStr: any): boolean {
    if (!dateStr) return false;
    
    // Si es un string, verificar que tenga formato de fecha válido
    if (typeof dateStr === 'string') {
      // Intentar convertirlo a fecha
      const date = new Date(dateStr);
      return !isNaN(date.getTime());
    }
    
    // Si ya es un objeto Date
    if (dateStr instanceof Date) {
      return !isNaN(dateStr.getTime());
    }
    
    return false;
  }

  // Método para mostrar mensajes toast
  async presentToast(message: string, color: 'success' | 'warning' | 'danger' | 'medium' = 'medium') {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 2500,
      position: 'bottom',
      color: color
    });
    toast.present();
  }
}