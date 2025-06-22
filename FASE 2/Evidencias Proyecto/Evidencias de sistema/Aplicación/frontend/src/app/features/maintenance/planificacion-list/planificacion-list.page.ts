import { Component, OnInit, ViewChildren, QueryList } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { IonicModule, NavController, AlertController, ToastController, LoadingController, IonItemSliding, ModalController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  eyeOutline, createOutline, trashOutline, addCircleOutline, 
  calendarOutline, listOutline, timeOutline, shieldCheckmarkOutline, 
  powerOutline, documentTextOutline, checkboxOutline, carOutline,
  calendarNumberOutline, settingsOutline
} from 'ionicons/icons';

import { ApiService, PlanificacionMantenimientoResumen } from '../../../core/services/api.service';

import { AlertaPersonalizadaComponent } from '../../../shared/components/alerta-personalizada/alerta-personalizada.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-planificacion-list',
  templateUrl: './planificacion-list.page.html',
  styleUrls: ['./planificacion-list.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonicModule,
    DatePipe,
    AlertaPersonalizadaComponent,  // modal personalizado
    PageHeaderComponent
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
    private loadingCtrl: LoadingController,
    private modalCtrl: ModalController
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

  async generarOt(plan: PlanificacionMantenimientoResumen) {
    await this.closeAllSlidingItems();

    if (!plan.vehiculosEnPlan || plan.vehiculosEnPlan.length === 0) {
      this.mostrarToast('Este plan no tiene vehículos asignados para generar una OT.', 'warning');
      return;
    }

    const vehiculo = plan.vehiculosEnPlan[0];
    const idUsuario = 1;

    // Mostrar confirmación de generación con modal personalizado
    const modal = await this.modalCtrl.create({
      component: AlertaPersonalizadaComponent,
      componentProps: {
        title: 'Generar Orden de Trabajo',
        message: `Se creará una OT para el vehículo <strong>${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.patente})</strong> a partir del plan "${plan.descPlan}". ¿Continuar?`,
        icon: 'help',
        buttons: [
          { text: 'Cancelar', role: 'cancel', cssClass: 'button-cancel' },
          { text: 'Generar', role: 'confirm', cssClass: 'confirm-button' }
        ]
      },
      backdropDismiss: false,
      cssClass: 'custom-alert-modal'
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data === 'confirm') {
      const loading = await this.loadingCtrl.create({ message: 'Generando OT...' });
      await loading.present();
      this.apiService.generarOt(plan.idPlan, vehiculo.idVehi, idUsuario).subscribe({
        next: async (res) => {
          await loading.dismiss();
          this.mostrarToast(`¡Orden de Trabajo #${res.id_ot} generada con éxito!`, 'success');
        },
        error: async (err) => {
          await loading.dismiss();
          console.error('Error al generar la OT:', err);
          this.mostrarToast(err.error?.error || 'No se pudo generar la OT.', 'danger');
        }
      });
    }
  }  async irACrearPlan() {
    const { PlanificacionFormPage } = await import('../planificacion-form/planificacion-form.page');
    const modal = await this.modalCtrl.create({
      component: PlanificacionFormPage,
      cssClass: 'planificacion-form-modal'
    });

    modal.onDidDismiss().then((result) => {
      if (result.data && result.data.planificacionCreated) {
        this.cargarPlanificaciones();
      }
    });

    return await modal.present();
  }

  private async closeAllSlidingItems(): Promise<void> {
    if (this.slidingItems && this.slidingItems.length > 0) {
      const items = this.slidingItems.toArray();
      await Promise.all(items.map(item => item.closeOpened()));
    }
  }  async verDetalle(plan: PlanificacionMantenimientoResumen) {
    await this.closeAllSlidingItems();
    
    const { PlanificacionFormPage } = await import('../planificacion-form/planificacion-form.page');
    const modal = await this.modalCtrl.create({
      component: PlanificacionFormPage,
      componentProps: {
        planId: plan.idPlan,
        isViewMode: true
      },
      cssClass: 'planificacion-form-modal'
    });

    return await modal.present();
  }  async editarPlan(plan: PlanificacionMantenimientoResumen) {
    await this.closeAllSlidingItems();
    
    const { PlanificacionFormPage } = await import('../planificacion-form/planificacion-form.page');
    const modal = await this.modalCtrl.create({
      component: PlanificacionFormPage,
      componentProps: {
        planId: plan.idPlan,
        isEditMode: true
      },
      cssClass: 'planificacion-form-modal'
    });

    modal.onDidDismiss().then((result) => {
      if (result.data && result.data.planificacionUpdated) {
        this.cargarPlanificaciones();
      }
    });

    return await modal.present();
  }

  async confirmarEliminar(plan: PlanificacionMantenimientoResumen) {
    await this.closeAllSlidingItems();
    const modal = await this.modalCtrl.create({
      component: AlertaPersonalizadaComponent,
      componentProps: {
        title: 'Confirmar Eliminación',
        message: `¿Está seguro de que desea eliminar el plan "<strong>${plan.descPlan}</strong>"? Esta acción no se puede deshacer.`,
        icon: 'info',  // Cambiado de 'warning' a 'info' para mostrar '?' en lugar de advertencia
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
      this.eliminarPlan(plan.idPlan);
    }
  }

  async eliminarPlan(planId: number) {
    const loading = await this.loadingCtrl.create({ message: 'Eliminando plan...' });
    await loading.present();

    this.apiService.deletePlanificacion(planId).subscribe({
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