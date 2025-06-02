import { Component, OnInit, ViewChildren, QueryList } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // Importa DatePipe
import { IonicModule, NavController, AlertController, ToastController, LoadingController, IonItemSliding } from '@ionic/angular';
import { RouterModule } from '@angular/router'; // Para routerLink
import { ApiService, PlanificacionMantenimientoResumen } from '../../../services/api.service'; // Ajusta la ruta

@Component({
  selector: 'app-planificacion-list',
  templateUrl: './planificacion-list.page.html',
  styleUrls: ['./planificacion-list.page.scss'],
  standalone: true,
  imports: [
    CommonModule, // Necesario para *ngIf, *ngFor, y el DatePipe
    RouterModule, // Necesario para [routerLink]
    IonicModule,  // Necesario para todos los componentes ion-*
    // DatePipe // Ya no es necesario importar DatePipe aquí directamente si CommonModule está bien configurado.
               // CommonModule lo re-exporta.
  ],
  // providers: [DatePipe] // No es necesario si CommonModule lo provee.
})
export class PlanificacionListPage implements OnInit {
  @ViewChildren(IonItemSliding) slidingItems!: QueryList<IonItemSliding>;
  planificaciones: PlanificacionMantenimientoResumen[] = [];
  isLoading: boolean = false;

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
        console.log('Planificaciones cargadas:', this.planificaciones);
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