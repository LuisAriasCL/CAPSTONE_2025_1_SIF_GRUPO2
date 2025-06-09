import { Component, OnInit, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController, AlertController, ToastController, LoadingController, IonItemSliding } from '@ionic/angular';
import { RouterModule } from '@angular/router';
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
  ) {}

  ngOnInit() {}

  ionViewWillEnter() {
    this.cargarPlanificaciones();
  }

  async cargarPlanificaciones(event?: any) {
    if (!event && this.planificaciones.length === 0) {
      this.isLoading = true;
    }
    let loadingIndicator: HTMLIonLoadingElement | null = null;
    if (!event && this.isLoading) {
      loadingIndicator = await this.loadingCtrl.create({ message: 'Cargando planes...', duration: 15000, spinner: 'dots' });
      await loadingIndicator.present();
    }

    this.apiService.getPlanificaciones().subscribe({
      next: (data) => {
        this.planificaciones = data;
      },
      error: async (error) => {
        console.error('Error cargando planificaciones:', error);
        this.mostrarToast(error.message || 'Error al cargar las planificaciones.', 'danger');
      },
      complete: () => {
        if (event?.target) {
          event.target.complete();
        }
        if(loadingIndicator) loadingIndicator.dismiss();
        this.isLoading = false;
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

    const alert = await this.alertCtrl.create({
      header: 'Generar Orden de Trabajo',
      message: `Se creará una OT para el vehículo <strong>${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.patente})</strong> a partir del plan <strong>"${plan.descPlan}"</strong>. ¿Continuar?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Generar',
          role: 'confirm',
          handler: async () => {
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
        }
      ]
    });
    await alert.present();
  }

  irACrearPlan() {
    this.navCtrl.navigateForward('/planificacion-form');
  }

  private async closeAllSlidingItems(): Promise<void> {
    if (this.slidingItems && this.slidingItems.length > 0) {
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