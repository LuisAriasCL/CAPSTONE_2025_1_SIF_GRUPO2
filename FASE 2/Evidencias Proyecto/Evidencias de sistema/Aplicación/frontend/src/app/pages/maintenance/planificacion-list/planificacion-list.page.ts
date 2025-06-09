import { Component, OnInit, ViewChildren, QueryList } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { IonicModule, NavController, AlertController, ToastController, LoadingController, IonItemSliding } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  eyeOutline, createOutline, trashOutline, addCircleOutline, 
  calendarOutline, listOutline, timeOutline, shieldCheckmarkOutline, 
  powerOutline, documentTextOutline, checkboxOutline, carOutline,
  calendarNumberOutline, settingsOutline
} from 'ionicons/icons';

import { ApiService, PlanificacionMantenimientoResumen } from '../../../services/api.service';

@Component({
  selector: 'app-planificacion-list',
  templateUrl: './planificacion-list.page.html',
  styleUrls: ['./planificacion-list.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonicModule,
  ],
})
export class PlanificacionListPage implements OnInit {
  @ViewChildren(IonItemSliding) slidingItems!: QueryList<IonItemSliding>;
  planificaciones: PlanificacionMantenimientoResumen[] = [];
  isLoading: boolean = false;
  pageTitle = 'Planes de Mantenimiento';

  constructor(
    private apiService: ApiService,
    private navCtrl: NavController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {
    addIcons({
      eyeOutline, createOutline, trashOutline, addCircleOutline,
      calendarOutline, listOutline, timeOutline, shieldCheckmarkOutline,
      powerOutline, documentTextOutline, checkboxOutline, carOutline,
      calendarNumberOutline, settingsOutline
    });
  }

  ngOnInit() {}

  ionViewWillEnter() {
    this.cargarPlanificaciones();
  }

  async cargarPlanificaciones(event?: any) {
    this.isLoading = true;
    let loadingIndicator: HTMLIonLoadingElement | undefined;
    if (!event) {
      loadingIndicator = await this.loadingCtrl.create({ message: 'Cargando planes...' });
      await loadingIndicator.present();
    }

    this.apiService.getPlanificaciones().subscribe({
      next: (data) => {
        this.planificaciones = data;
        this.isLoading = false;
        loadingIndicator?.dismiss();
        event?.target?.complete();
      },
      error: async (error) => {
        console.error('Error cargando planificaciones:', error);
        this.isLoading = false;
        loadingIndicator?.dismiss();
        event?.target?.complete();
        this.mostrarToast(error.message || 'Error al cargar las planificaciones.', 'danger');
      }
    });
  }

  irACrearPlan() {
    this.navCtrl.navigateForward('/planificacion-form'); // Ajusta esta ruta
  }

  private async closeAllSlidingItems(): Promise<void> {
    if (this.slidingItems && this.slidingItems.length > 0) { // Verifica que exista y tenga items
      const items = this.slidingItems.toArray();
      await Promise.all(items.map(item => item.closeOpened()));
    }
  }

  async verDetalle(plan: PlanificacionMantenimientoResumen) {
    await this.closeAllSlidingItems();
    console.log('Ver detalle del plan:', plan);
    this.mostrarToast(`Detalle para plan "${plan.descPlan}" (funcionalidad no implementada).`, 'medium');
  }

  async editarPlan(plan: PlanificacionMantenimientoResumen) {
    await this.closeAllSlidingItems();
    console.log('Editar plan:', plan);
    this.mostrarToast(`Editar plan "${plan.descPlan}" (funcionalidad no implementada).`, 'medium');
  }

  async confirmarEliminar(plan: PlanificacionMantenimientoResumen) {
    await this.closeAllSlidingItems();
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Eliminación',
      message: `¿Está seguro de que desea eliminar el plan "${plan.descPlan}"? Esta acción no se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => { this.eliminarPlan(plan.idPlan); },
        },
      ],
    });
    await alert.present();
  }

  async eliminarPlan(planId: number) {
    const loading = await this.loadingCtrl.create({ message: 'Eliminando plan...' });
    await loading.present();

    this.apiService.deletePlanificacion(planId).subscribe({ // Asume que tienes este método en ApiService
      next: async (response) => {
        await loading.dismiss();
        this.mostrarToast(response.message || 'Plan eliminado correctamente.', 'success');
        this.planificaciones = this.planificaciones.filter(p => p.idPlan !== planId);
      },
      error: async (error) => {
        await loading.dismiss();
        this.mostrarToast(error.message || 'No se pudo eliminar el plan.', 'danger');
      }
    });
  }

  getIconForPlanStatus(plan: PlanificacionMantenimientoResumen): string {
    if (!plan.esActivoPlan) return 'eye-off-outline';
    return plan.esPreventivo ? 'shield-checkmark-outline' : 'build-outline';
  }

  getColorForPlanStatus(plan: PlanificacionMantenimientoResumen): string {
    if (!plan.esActivoPlan) return 'medium';
    return plan.esPreventivo ? 'success' : 'warning';
  }

  async mostrarToast(mensaje: string, color: string = 'dark', duracion: number = 3000) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: duracion,
      color: color,
      position: 'bottom',
      buttons: [{ text: 'Cerrar', role: 'cancel' }]
    });
    toast.present();
  }
}