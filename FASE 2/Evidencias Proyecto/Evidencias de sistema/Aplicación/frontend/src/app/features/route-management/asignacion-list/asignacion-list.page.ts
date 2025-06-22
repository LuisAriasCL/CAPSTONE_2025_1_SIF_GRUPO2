import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, LoadingController, AlertController, ToastController, NavController, RefresherCustomEvent, ModalController } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { eyeOutline, createOutline, trashOutline, addCircleOutline, playCircleOutline, checkmarkCircleOutline, closeCircleOutline, timeOutline, carSportOutline, personCircleOutline, mapOutline, analyticsOutline, locationOutline, calendarOutline, optionsOutline } from 'ionicons/icons';

import { ApiService, AsignacionRecorrido, Route, Vehiculo, UsuarioConductorInfo } from '../../../core/services/api.service'; 
import { SocketService } from '../../../core/services/socket.service';
import { AsignacionFormPage } from '../asignacion-form/asignacion-form.page';
import { AlertaPersonalizadaComponent } from '../../../shared/components/alerta-personalizada/alerta-personalizada.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-asignacion-list',
  templateUrl: './asignacion-list.page.html',
  styleUrls: ['./asignacion-list.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, PageHeaderComponent]
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
      eyeOutline, createOutline, trashOutline, addCircleOutline, playCircleOutline,
      checkmarkCircleOutline, closeCircleOutline, timeOutline, carSportOutline,
      personCircleOutline, mapOutline, analyticsOutline, locationOutline, calendarOutline, optionsOutline
    });
  }

  ngOnInit() {}
  
  ionViewWillEnter() {
    this.loadAsignaciones();
  }
  
  async loadAsignaciones(event?: RefresherCustomEvent) {
    this.isLoading = true;
    let loadingIndicator: HTMLIonLoadingElement | undefined;
    if (!event) {
      loadingIndicator = await this.loadingCtrl.create({ message: 'Cargando asignaciones...' });
      await loadingIndicator.present();
    }

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
        const errorMsg = error?.message || 'No se pudo cargar la lista de asignaciones.';
        this.presentToast(errorMsg, 'danger');
      }
    });
  }

  handleRefresh(event: RefresherCustomEvent) {
    this.loadAsignaciones(event);
  }

  async goToCreateAsignacion() {
    const modal = await this.modalCtrl.create({
      component: AsignacionFormPage,
      componentProps: { isEditMode: false, isViewMode: false },
      cssClass: 'asignacion-form-modal',
      backdropDismiss: false
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data?.dataChanged) {
      this.loadAsignaciones();
    }
  }

  async viewOrEditAsignacion(idAsig?: number) {
    if (idAsig === undefined) return;
    const modal = await this.modalCtrl.create({
      component: AsignacionFormPage,
      componentProps: { asignacionId: idAsig, isEditMode: true, isViewMode: false },
      cssClass: 'asignacion-form-modal',
      backdropDismiss: false
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data?.dataChanged) {
      this.loadAsignaciones();
    }
  }

  async iniciarSeguimientoEnMapa(asignacion: AsignacionRecorrido) {
    console.log('[Simulación] Objeto de asignación recibido al hacer clic:', asignacion);


    const asignacionId = asignacion.idAsig || (asignacion as any).id_asig;
    const rutaId = asignacion.rutaPlantilla?.idRuta; 
    const vehiculoId = asignacion.vehiculo?.idVehi;

    if (asignacionId === undefined || rutaId === undefined || vehiculoId === undefined) {
      console.error('Datos incompletos para iniciar simulación. Faltan IDs.', { asignacionId, rutaId, vehiculoId });
      this.presentToast('Faltan datos de la asignación (ruta o vehículo) para iniciar el seguimiento.', 'warning');
      return;
    }

    if (asignacion.estadoAsig !== 'en_progreso' && asignacion.estadoAsig !== 'asignado') {
      this.presentToast(`El seguimiento solo se puede iniciar para asignaciones "En Progreso" o "Asignado".`, 'warning');
      return;
    }
    
    this.procederConInicioSimulacion(asignacionId, rutaId, vehiculoId);
  }

  private procederConInicioSimulacion(asignacionId: number, rutaId: number, vehiculoId: number) {
    console.log(`[Simulación] Datos correctos. Enviando evento 'startSimulation' con Asignación ID: ${asignacionId}`);
    this.socketService.emit('startSimulation', {
      routeId: rutaId,
      vehicleId: vehiculoId,
      asignacionId: asignacionId
    });
    this.router.navigate(['/recorridos'], { 
      queryParams: { asignacionId, vehiculoId, rutaId }
    });
  }

  async confirmDeleteAsignacion(asignacion: AsignacionRecorrido) {
    const asignacionId = asignacion.idAsig || (asignacion as any).id_asig;
    if (asignacionId === undefined) return;
    
    const modal = await this.modalCtrl.create({
      component: AlertaPersonalizadaComponent,
      componentProps: {
        title: 'Confirmar Eliminación',
        message: `¿Seguro de eliminar la asignación para la ruta "<strong>${asignacion.rutaPlantilla?.nombreRuta || 'Desconocida'}</strong>"?`,
        icon: 'warning',
        buttons: [
          { text: 'Cancelar', role: 'cancel', cssClass: 'button-cancel' },
          { text: 'Eliminar', role: 'confirm', cssClass: 'button-danger' }
        ]
      },
      backdropDismiss: false,
      cssClass: 'custom-alert-modal'
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data === 'confirm') {
      this.deleteAsignacion(asignacionId);
    }
  }

  async deleteAsignacion(idAsig: number) {
    const loading = await this.loadingCtrl.create({ message: 'Eliminando asignación...' });
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
        this.showErrorAlert('Error al Eliminar', `No se pudo eliminar la asignación: ${errorMsg}`);
      }
    });
  }

  async cambiarEstadoAsignacion(asignacion: AsignacionRecorrido, nuevoEstado: 'en_progreso' | 'completado' | 'cancelado') {
    const asignacionId = asignacion.idAsig || (asignacion as any).id_asig;
    if (asignacionId === undefined) return;

    const modal = await this.modalCtrl.create({
      component: AlertaPersonalizadaComponent,
      componentProps: {
        title: `Confirmar ${this.getEstadoDisplay(nuevoEstado)}`,
        message: `¿Confirmas cambiar el estado a "${this.getEstadoDisplay(nuevoEstado)}"?`,
        icon: nuevoEstado === 'cancelado' ? 'warning' : 'help',
        buttons: [{ text: 'Cancelar', role: 'cancel' }, { text: 'Confirmar', role: 'confirm' }]
      },
      backdropDismiss: false,
      cssClass: 'custom-alert-modal'
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data !== 'confirm') return;

    if (nuevoEstado === 'completado' && asignacion.kmFinRecor == null) {
      this.showErrorAlert('Falta Información', 'Para marcar como "Completado", edita la asignación y registra los KM finales.');
      return;
    }

    const loading = await this.loadingCtrl.create({ message: `Actualizando estado...` });
    await loading.present();
    this.apiService.updateAsignacionRecorrido(asignacionId, { estadoAsig: nuevoEstado }).subscribe({
      next: async (updatedAsignacion) => {
        await loading.dismiss();
        this.presentToast(`Estado actualizado a "${this.getEstadoDisplay(nuevoEstado)}".`, 'success');
        const index = this.asignaciones.findIndex(a => (a.idAsig || (a as any).id_asig) === asignacionId);
        if (index !== -1) this.asignaciones[index] = { ...this.asignaciones[index], ...updatedAsignacion };
      },
      error: async (error: any) => {
        await loading.dismiss();
        this.showErrorAlert('Error', `No se pudo actualizar el estado: ${error.message}`);
      }
    });
  }

async presentToast(message: string, color: string = 'primary', duration: number = 3000) {
  const toast = await this.toastCtrl.create({ message, duration, color, position: 'bottom', mode: 'md' });
  toast.present();
}
  
  async showErrorAlert(title: string, message: string) {
    const modal = await this.modalCtrl.create({
      component: AlertaPersonalizadaComponent,
      componentProps: { title, message, icon: 'error', buttons: [{ text: 'Aceptar', role: 'confirm' }] },
      cssClass: 'custom-alert-modal'
    });
    await modal.present();
  }

  getEstadoDisplay(estado: string): string {
    return estado.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  // Agregar método para el botón del header
  irACrearAsignacion() {
    // Método que se ejecuta al hacer click en el botón del header
    this.abrirModal();
  }

  abrirModal() {
    this.goToCreateAsignacion();
  }
}
