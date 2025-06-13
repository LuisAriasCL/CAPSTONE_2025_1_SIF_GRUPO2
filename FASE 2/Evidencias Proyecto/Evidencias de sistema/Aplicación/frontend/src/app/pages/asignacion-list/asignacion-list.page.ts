// src/app/pages/asignacion-list/asignacion-list.page.ts
import { Component, OnInit, inject } from '@angular/core';
import {
  CommonModule,
  DatePipe,
  DecimalPipe,
  UpperCasePipe,
} from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonicModule,
  LoadingController,
  AlertController,
  ToastController,
  NavController,
  RefresherCustomEvent,
  ModalController,
} from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  eyeOutline,
  createOutline,
  trashOutline,
  addCircleOutline,
  playCircleOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  timeOutline,
  carSportOutline,
  personCircleOutline,
  mapOutline,
  analyticsOutline,
  locationOutline,
  calendarOutline,
  optionsOutline,
} from 'ionicons/icons';

// CORRECCIÓN AQUÍ: Cambiar 'Ruta' por 'Route'
import {
  ApiService,
  AsignacionRecorrido,
  Route,
  UsuarioConductorInfo,
} from '../../services/api.service';
import { Vehiculo } from 'src/types/components.types';
import { SocketService } from '../../services/socket.service';
import { AsignacionFormPage } from '../asignacion-form/asignacion-form.page';
import { AlertaPersonalizadaComponent } from '../../componentes/alerta-personalizada/alerta-personalizada.component';

@Component({
  selector: 'app-asignacion-list',
  templateUrl: './asignacion-list.page.html',
  styleUrls: ['./asignacion-list.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    DatePipe,
    DecimalPipe,
    UpperCasePipe,
    AlertaPersonalizadaComponent,
  ],
})
export class AsignacionListPage implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);
  private socketService = inject(SocketService);
  private modalCtrl = inject(ModalController);
  pageTitle = 'Asignaciones de Recorrido';
  asignaciones: AsignacionRecorrido[] = [];
  isLoading = false;

  constructor() {
    addIcons({
      eyeOutline,
      createOutline,
      trashOutline,
      addCircleOutline,
      playCircleOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      timeOutline,
      carSportOutline,
      personCircleOutline,
      mapOutline,
      analyticsOutline,
      locationOutline,
      calendarOutline,
      optionsOutline,
    });
  }

  ngOnInit() {
    // Simplificar inicialización
  }
  ionViewWillEnter() {
    this.loadAsignaciones();
  }
  async loadAsignaciones(event?: RefresherCustomEvent) {
    this.isLoading = true;
    let loadingIndicator: HTMLIonLoadingElement | undefined;
    if (!event) {
      loadingIndicator = await this.loadingCtrl.create({
        message: 'Cargando asignaciones...',
      });
      await loadingIndicator.present();
    }

    // Cargar todas las asignaciones sin filtros
    this.apiService.getAsignacionesRecorrido().subscribe({
      next: (data: AsignacionRecorrido[]) => {
        this.asignaciones = data;
        this.isLoading = false;
        loadingIndicator?.dismiss();
        event?.target?.complete();
      },
      error: async (error: any) => {
        console.error('Error al cargar asignaciones:', error);
        this.isLoading = false;
        loadingIndicator?.dismiss();
        event?.target?.complete();
        const errorMsg =
          error?.message || 'No se pudo cargar la lista de asignaciones.';
        this.presentToast(errorMsg, 'danger');
      },
    });
  }

  limpiarFiltros() {
    // Sin filtros, recargar asignaciones
    this.loadAsignaciones();
  }

  handleRefresh(event: RefresherCustomEvent) {
    this.loadAsignaciones(event);
  }

  async goToCreateAsignacion() {
    const modal = await this.modalCtrl.create({
      component: AsignacionFormPage,
      componentProps: {
        isEditMode: false,
        isViewMode: false,
      },
      cssClass: 'asignacion-form-modal',
      backdropDismiss: false,
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data && data.dataChanged) {
      this.loadAsignaciones(); // Recargar la lista si se creó una nueva asignación
    }
  }

  async viewOrEditAsignacion(idAsig?: number) {
    if (idAsig === undefined) return;

    const modal = await this.modalCtrl.create({
      component: AsignacionFormPage,
      componentProps: {
        asignacionId: idAsig,
        isEditMode: true,
        isViewMode: false,
      },
      cssClass: 'asignacion-form-modal',
      backdropDismiss: false,
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data && data.dataChanged) {
      this.loadAsignaciones(); // Recargar la lista si se actualizó la asignación
    }
  }

  async iniciarSeguimientoEnMapa(asignacion: AsignacionRecorrido) {
    const asignacionId = asignacion.idAsig;
    // Acceder a idRuta a través de asignacion.rutaPlantilla (que es de tipo Route | undefined)
    const rutaId = asignacion.rutaPlantilla?.idRuta;
    const vehiculoId = asignacion.vehiculo?.idVehi;

    if (
      asignacionId === undefined ||
      rutaId === undefined ||
      vehiculoId === undefined
    ) {
      console.error(
        'Datos incompletos en la asignación (idAsig, rutaPlantilla.idRuta, vehiculo.idVehi):',
        asignacion
      );
      this.presentToast(
        'Faltan datos de la asignación (ruta o vehículo) para iniciar el seguimiento.',
        'warning'
      );
      return;
    }

    if (
      asignacion.estadoAsig !== 'en_progreso' &&
      asignacion.estadoAsig !== 'asignado'
    ) {
      this.presentToast(
        `El seguimiento solo se puede iniciar para asignaciones "En Progreso" o "Asignado". Estado actual: ${asignacion.estadoAsig}`,
        'warning'
      );
      return;
    }

    this.procederConInicioSimulacion(asignacionId, rutaId, vehiculoId);
  }

  private procederConInicioSimulacion(
    asignacionId: number,
    rutaId: number,
    vehiculoId: number
  ) {
    console.log(
      `Iniciando seguimiento para Asignación ID: ${asignacionId}, Ruta ID: ${rutaId}, Vehículo ID: ${vehiculoId}`
    );

    this.socketService.emit('startSimulation', {
      routeId: rutaId,
      vehicleId: vehiculoId,
      asignacionId: asignacionId,
    });

    this.router.navigate(['/recorridos'], {
      queryParams: {
        asignacionId: asignacionId,
        vehiculoId: vehiculoId,
        rutaId: rutaId,
      },
    });
  }

  async confirmDeleteAsignacion(asignacion: AsignacionRecorrido) {
    if (asignacion.idAsig === undefined) return;

    const modal = await this.modalCtrl.create({
      component: AlertaPersonalizadaComponent,
      componentProps: {
        title: 'Confirmar Eliminación',
        message: `¿Seguro de eliminar la asignación para la ruta "<strong>${
          asignacion.rutaPlantilla?.nombreRuta || 'Desconocida'
        }</strong>"?`,
        icon: 'warning',
        buttons: [
          { text: 'Cancelar', role: 'cancel', cssClass: 'button-cancel' },
          { text: 'Eliminar', role: 'confirm', cssClass: 'button-danger' },
        ],
      },
      backdropDismiss: false,
      cssClass: 'custom-alert-modal',
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();

    if (data === 'confirm') {
      this.deleteAsignacion(asignacion.idAsig);
    }
  }

  async deleteAsignacion(idAsig: number) {
    const loading = await this.loadingCtrl.create({
      message: 'Eliminando asignación...',
    });
    await loading.present();

    this.apiService.deleteAsignacionRecorrido(idAsig).subscribe({
      next: async () => {
        await loading.dismiss();
        this.presentToast('Asignación eliminada correctamente.', 'success');
        this.loadAsignaciones();
      },
      error: async (error: any) => {
        await loading.dismiss();
        const errorMsg = error?.message || 'No se pudo eliminar la asignación.';

        // Mostrar alerta personalizada para el error
        const errorModal = await this.modalCtrl.create({
          component: AlertaPersonalizadaComponent,
          componentProps: {
            title: 'Error al Eliminar',
            message: `No se pudo eliminar la asignación: ${errorMsg}`,
            icon: 'error',
            buttons: [{ text: 'Aceptar', role: 'confirm' }],
          },
          cssClass: 'custom-alert-modal',
        });
        await errorModal.present();
      },
    });
  }

  async cambiarEstadoAsignacion(
    asignacion: AsignacionRecorrido,
    nuevoEstado: 'en_progreso' | 'completado' | 'cancelado'
  ) {
    if (asignacion.idAsig === undefined) return;

    let confirmMessage = '';
    let confirmTitle = '';

    switch (nuevoEstado) {
      case 'en_progreso':
        confirmTitle = 'Iniciar Recorrido';
        confirmMessage = `¿Confirmas iniciar el recorrido para la ruta "<strong>${
          asignacion.rutaPlantilla?.nombreRuta || 'Desconocida'
        }</strong>"?`;
        break;
      case 'completado':
        confirmTitle = 'Completar Recorrido';
        confirmMessage = `¿Confirmas completar el recorrido? Asegúrate de haber registrado los kilómetros finales.`;
        break;
      case 'cancelado':
        confirmTitle = 'Cancelar Asignación';
        confirmMessage = `¿Estás seguro de cancelar esta asignación de recorrido?`;
        break;
    }

    const modal = await this.modalCtrl.create({
      component: AlertaPersonalizadaComponent,
      componentProps: {
        title: confirmTitle,
        message: confirmMessage,
        icon: nuevoEstado === 'cancelado' ? 'warning' : 'help',
        buttons: [
          { text: 'Cancelar', role: 'cancel', cssClass: 'button-cancel' },
          { text: 'Confirmar', role: 'confirm', cssClass: 'confirm-button' },
        ],
      },
      backdropDismiss: false,
      cssClass: 'custom-alert-modal',
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();

    if (data !== 'confirm') return;

    const loading = await this.loadingCtrl.create({
      message: `Actualizando estado a ${nuevoEstado}...`,
    });
    await loading.present();

    let datosParaActualizar: Partial<AsignacionRecorrido> = {
      estadoAsig: nuevoEstado,
    };

    if (nuevoEstado === 'en_progreso' && asignacion.estadoAsig === 'asignado') {
      console.log(`Iniciando recorrido para asignación ${asignacion.idAsig}.`);
    } else if (nuevoEstado === 'completado') {
      if (!asignacion.fecFinRecor) {
        datosParaActualizar.fecFinRecor = new Date().toISOString();
      }
      if (asignacion.kmFinRecor == null) {
        await loading.dismiss();

        // Mostrar alerta personalizada
        const warnModal = await this.modalCtrl.create({
          component: AlertaPersonalizadaComponent,
          componentProps: {
            title: 'Falta Información',
            message:
              'Para marcar como "Completado", edita la asignación y registra los KM finales.',
            icon: 'warning',
            buttons: [{ text: 'Entendido', role: 'confirm' }],
          },
          cssClass: 'custom-alert-modal',
        });
        await warnModal.present();
        return;
      }
    }

    this.apiService
      .updateAsignacionRecorrido(asignacion.idAsig, datosParaActualizar)
      .subscribe({
        next: async (updatedAsignacion) => {
          await loading.dismiss();
          this.presentToast(
            `Estado de asignación actualizado a "${nuevoEstado}".`,
            'success'
          );
          const index = this.asignaciones.findIndex(
            (a) => a.idAsig === asignacion.idAsig
          );
          if (index !== -1 && updatedAsignacion) {
            this.asignaciones[index] = {
              ...this.asignaciones[index],
              ...updatedAsignacion,
            };
          } else {
            this.loadAsignaciones();
          }
        },
        error: async (error: any) => {
          await loading.dismiss();
          const errorMsg = error?.message || 'No se pudo actualizar el estado.';

          // Mostrar alerta personalizada para el error
          const errorModal = await this.modalCtrl.create({
            component: AlertaPersonalizadaComponent,
            componentProps: {
              title: 'Error',
              message: `No se pudo actualizar el estado: ${errorMsg}`,
              icon: 'error',
              buttons: [{ text: 'Aceptar', role: 'confirm' }],
            },
            cssClass: 'custom-alert-modal',
          });
          await errorModal.present();
        },
      });
  }

  async presentToast(
    message: string,
    color: 'success' | 'warning' | 'danger' | 'primary' | 'medium' = 'primary',
    duration: number = 3000
  ) {
    const toast = await this.toastCtrl.create({
      message,
      duration,
      color,
      position: 'bottom',
      mode: 'md',
    });
    toast.present();
  }

  getEstadoDisplay(estado: string): string {
    switch (estado) {
      case 'en_progreso':
        return 'En progreso';
      case 'pendiente':
        return 'Pendiente';
      case 'asignado':
        return 'Asignado';
      case 'completado':
        return 'Completado';
      case 'cancelado':
        return 'Cancelado';
      default:
        return estado;
    }
  }
}
