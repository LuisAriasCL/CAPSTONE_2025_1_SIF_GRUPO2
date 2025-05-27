// src/app/pages/asignacion-list/asignacion-list.page.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, LoadingController, AlertController, ToastController, NavController, RefresherCustomEvent } from '@ionic/angular'; // Importar RefresherCustomEvent
import { Router, RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { eyeOutline, createOutline, trashOutline, addCircleOutline, playCircleOutline, checkmarkCircleOutline, closeCircleOutline, timeOutline, carSportOutline, personCircleOutline, mapOutline } from 'ionicons/icons';

import { ApiService, AsignacionRecorrido } from '../../services/api.service';


@Component({
  selector: 'app-asignacion-list',
  templateUrl: './asignacion-list.page.html',
  styleUrls: ['./asignacion-list.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterLink,
  
    DatePipe,
    DecimalPipe
  ]
})
export class AsignacionListPage implements OnInit {

  private apiService = inject(ApiService);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);
  private navCtrl = inject(NavController); 

  asignaciones: AsignacionRecorrido[] = [];
  isLoading = false;
  filtros = {
    estado: '',
    fechaDesde: '',
    fechaHasta: ''
  };

  constructor() {
    addIcons({
      eyeOutline, createOutline, trashOutline, addCircleOutline, playCircleOutline,
      checkmarkCircleOutline, closeCircleOutline, timeOutline, carSportOutline,
      personCircleOutline, mapOutline
    });
  }

  ngOnInit() {
    // Carga inicial en ionViewWillEnter
  }

  ionViewWillEnter() {
    this.loadAsignaciones();
  }

  async loadAsignaciones(event?: RefresherCustomEvent) { // Usar RefresherCustomEvent
    this.isLoading = true;
    let loadingIndicator: HTMLIonLoadingElement | undefined;
    if (!event) {
      loadingIndicator = await this.loadingCtrl.create({ message: 'Cargando asignaciones...' });
      await loadingIndicator.present();
    }

    const apiFiltros: any = {};
    if (this.filtros.estado) apiFiltros.estado = this.filtros.estado;
    if (this.filtros.fechaDesde) apiFiltros.fechaDesde = this.filtros.fechaDesde;
    if (this.filtros.fechaHasta) apiFiltros.fechaHasta = this.filtros.fechaHasta;

    this.apiService.getAsignacionesRecorrido(apiFiltros).subscribe({
      next: (data) => {
        this.asignaciones = data;
        this.isLoading = false;
        loadingIndicator?.dismiss();
        event?.target?.complete(); 
      },
      error: async (error) => {
        console.error('Error al cargar asignaciones:', error);
        this.isLoading = false;
        loadingIndicator?.dismiss();
        event?.target?.complete(); 
        const errorMsg = error.message || 'No se pudo cargar la lista de asignaciones.';
        this.presentToast(errorMsg, 'danger');
      }
    });
  }

  aplicarFiltros() {
    this.loadAsignaciones();
  }

  limpiarFiltros() {
    this.filtros = { estado: '', fechaDesde: '', fechaHasta: '' };
    this.loadAsignaciones();
  }

  handleRefresh(event: RefresherCustomEvent) { 
    this.loadAsignaciones(event);
  }

  goToCreateAsignacion() {
   
    this.router.navigate(['/asignaciones-recorrido/nueva']);
  }

  viewAsignacion(idAsig: number) {
   
    this.router.navigate(['/asignaciones-recorrido/editar', idAsig]);
  }

  editAsignacion(idAsig: number) {
  
    this.router.navigate(['/asignaciones-recorrido/editar', idAsig]);
  }

  async confirmDeleteAsignacion(asignacion: AsignacionRecorrido) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Eliminación',
      message: `¿Estás seguro de eliminar la asignación para la ruta "${asignacion.rutaPlantilla?.nombreRuta || 'Desconocida'}" del vehículo "${asignacion.vehiculo?.patente || 'N/A'}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          cssClass: 'danger',
          handler: () => this.deleteAsignacion(asignacion.idAsig)
        }
      ]
    });
    await alert.present();
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
      error: async (error) => {
        await loading.dismiss();
        const errorMsg = error.message || 'No se pudo eliminar la asignación.';
        this.presentToast(errorMsg, 'danger');
      }
    });
  }

  async cambiarEstadoAsignacion(asignacion: AsignacionRecorrido, nuevoEstado: 'en_progreso' | 'completado' | 'cancelado') {
    let datosParaActualizar: any = { estadoAsig: nuevoEstado };

    if (nuevoEstado === 'en_progreso' && asignacion.estadoAsig === 'asignado') {
        console.log(`Iniciando recorrido para asignación ${asignacion.idAsig}`);
    } else if (nuevoEstado === 'completado') {
        if (asignacion.kmFinRecor === null || asignacion.kmFinRecor === undefined) {
            this.presentToast('Para completar, edita la asignación y registra los KM finales.', 'warning');
            // Podrías decidir no cambiar el estado aquí y forzar la edición
            // return;
        }
        datosParaActualizar.fecFinRecor = new Date().toISOString();
    }

    const loading = await this.loadingCtrl.create({ message: `Actualizando estado a ${nuevoEstado}...` });
    await loading.present();

    this.apiService.updateAsignacionRecorrido(asignacion.idAsig, datosParaActualizar).subscribe({
        next: async (updatedAsignacion) => {
            await loading.dismiss();
            this.presentToast(`Estado de asignación actualizado a ${nuevoEstado}.`, 'success');
            this.loadAsignaciones();
        },
        error: async (error) => {
            await loading.dismiss();
            const errorMsg = error.message || 'No se pudo actualizar el estado.';
            this.presentToast(errorMsg, 'danger');
        }
    });
  }

  async presentToast(message: string, color: 'success' | 'warning' | 'danger' | 'primary' | 'medium' = 'primary', duration: number = 2500) {
    //                                                                                       ^^^^^^^^^^^^^^^^^^^^^^^ Tipo de color actualizado
    const toast = await this.toastCtrl.create({ message, duration, color, position: 'bottom' });
    toast.present();
  }
}
