// src/app/pages/asignacion-list/asignacion-list.page.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, LoadingController, AlertController, ToastController, NavController, RefresherCustomEvent } from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { eyeOutline, createOutline, trashOutline, addCircleOutline, playCircleOutline, checkmarkCircleOutline, closeCircleOutline, timeOutline, carSportOutline, personCircleOutline, mapOutline, analyticsOutline } from 'ionicons/icons';

// CORRECCIÓN AQUÍ: Cambiar 'Ruta' por 'Route'
import { ApiService, AsignacionRecorrido, Route, Vehiculo, UsuarioConductorInfo } from '../../services/api.service'; 
import { SocketService } from '../../services/socket.service';

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
    DecimalPipe,
    TitleCasePipe
  ]
})
export class AsignacionListPage implements OnInit {

  private apiService = inject(ApiService);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);
  private socketService = inject(SocketService);

  pageTitle = 'Asignaciones de Recorrido';

  asignaciones: AsignacionRecorrido[] = []; // Esto está bien.
  isLoading = false;
  filtros = {
    estado: '',
  };

  constructor() {
    addIcons({
      eyeOutline, createOutline, trashOutline, addCircleOutline, playCircleOutline,
      checkmarkCircleOutline, closeCircleOutline, timeOutline, carSportOutline,
      personCircleOutline, mapOutline, analyticsOutline
    });
  }

  ngOnInit() { }

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

    const apiFiltros: any = {};
    if (this.filtros.estado) apiFiltros.estadoAsig = this.filtros.estado;

    // Usar el método existente getAsignacionesRecorrido
    // y tipar 'data' y 'error'
    this.apiService.getAsignacionesRecorrido(apiFiltros).subscribe({
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

  aplicarFiltros() {
    this.loadAsignaciones();
  }

  limpiarFiltros() {
    this.filtros = { estado: '' };
    this.loadAsignaciones();
  }

  handleRefresh(event: RefresherCustomEvent) {
    this.loadAsignaciones(event);
  }

  goToCreateAsignacion() {
    this.router.navigate(['/asignaciones-recorrido/nueva']);
  }

  viewOrEditAsignacion(idAsig?: number) {
    if (idAsig === undefined) return;
    this.router.navigate(['/asignaciones-recorrido/editar/', idAsig]);
  }

  async iniciarSeguimientoEnMapa(asignacion: AsignacionRecorrido) {
    const asignacionId = asignacion.idAsig;
    // Acceder a idRuta a través de asignacion.rutaPlantilla (que es de tipo Route | undefined)
    const rutaId = asignacion.rutaPlantilla?.idRuta; 
    const vehiculoId = asignacion.vehiculo?.idVehi;

    if (asignacionId === undefined || rutaId === undefined || vehiculoId === undefined) {
      console.error('Datos incompletos en la asignación (idAsig, rutaPlantilla.idRuta, vehiculo.idVehi):', asignacion);
      this.presentToast('Faltan datos de la asignación (ruta o vehículo) para iniciar el seguimiento.', 'warning');
      return;
    }

    if (asignacion.estadoAsig !== 'en_progreso' && asignacion.estadoAsig !== 'asignado') {
      this.presentToast(`El seguimiento solo se puede iniciar para asignaciones "En Progreso" o "Asignado". Estado actual: ${asignacion.estadoAsig}`, 'warning');
      return;
    }
    
    this.procederConInicioSimulacion(asignacionId, rutaId, vehiculoId);
  }

  private procederConInicioSimulacion(asignacionId: number, rutaId: number, vehiculoId: number) {
    console.log(`Iniciando seguimiento para Asignación ID: ${asignacionId}, Ruta ID: ${rutaId}, Vehículo ID: ${vehiculoId}`);

    this.socketService.emit('startSimulation', {
      routeId: rutaId,
      vehicleId: vehiculoId,
      asignacionId: asignacionId
    });

    this.router.navigate(['/recorridos'], { 
      queryParams: {
        asignacionId: asignacionId,
        vehiculoId: vehiculoId,
        rutaId: rutaId
      }
    });
  }

  async confirmDeleteAsignacion(asignacion: AsignacionRecorrido) {
    if (asignacion.idAsig === undefined) return;
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Eliminación',
      message: `¿Seguro de eliminar la asignación para la ruta "${asignacion.rutaPlantilla?.nombreRuta || 'Desconocida'}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            if (asignacion.idAsig !== undefined) {
                 this.deleteAsignacion(asignacion.idAsig);
            }
          }
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
      error: async (error: any) => {
        await loading.dismiss();
        const errorMsg = error?.message || 'No se pudo eliminar la asignación.';
        this.presentToast(errorMsg, 'danger');
      }
    });
  }

  async cambiarEstadoAsignacion(asignacion: AsignacionRecorrido, nuevoEstado: 'en_progreso' | 'completado' | 'cancelado') {
    if (asignacion.idAsig === undefined) return;

    const loading = await this.loadingCtrl.create({ message: `Actualizando estado a ${nuevoEstado}...` });
    await loading.present();

    let datosParaActualizar: Partial<AsignacionRecorrido> = { estadoAsig: nuevoEstado };

    if (nuevoEstado === 'en_progreso' && asignacion.estadoAsig === 'asignado') {
      console.log(`Iniciando recorrido para asignación ${asignacion.idAsig}.`);
    } else if (nuevoEstado === 'completado') {
      if (!asignacion.fecFinRecor) {
          datosParaActualizar.fecFinRecor = new Date().toISOString();
      }
      if (asignacion.kmFinRecor == null) {
          await loading.dismiss();
          this.presentToast('Para marcar como "Completado", edita la asignación y registra los KM finales.', 'warning');
          return;
      }
    }

    this.apiService.updateAsignacionRecorrido(asignacion.idAsig, datosParaActualizar).subscribe({
        next: async (updatedAsignacion) => {
            await loading.dismiss();
            this.presentToast(`Estado de asignación actualizado a "${nuevoEstado}".`, 'success');
            const index = this.asignaciones.findIndex(a => a.idAsig === asignacion.idAsig);
            if (index !== -1 && updatedAsignacion) { 
                this.asignaciones[index] = { ...this.asignaciones[index], ...updatedAsignacion };
            } else {
                this.loadAsignaciones();
            }
        },
        error: async (error: any) => {
            await loading.dismiss();
            const errorMsg = error?.message || 'No se pudo actualizar el estado.';
            this.presentToast(errorMsg, 'danger');
        }
    });
  }

  async presentToast(message: string, color: 'success' | 'warning' | 'danger' | 'primary' | 'medium' = 'primary', duration: number = 3000) {
    const toast = await this.toastCtrl.create({ message, duration, color, position: 'bottom', mode: 'md' });
    toast.present();
  }
}