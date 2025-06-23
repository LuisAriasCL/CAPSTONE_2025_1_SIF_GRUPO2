import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonicModule,
  NavController,
  LoadingController,
  ToastController,
  AlertController,
  ModalController,
} from '@ionic/angular';
import { ApiService, OrdenTrabajoResumen } from 'src/app/services/api.service';
import { TitleService } from 'src/app/services/title.service';
import { AlertaPersonalizadaComponent } from '../../../componentes/alerta-personalizada/alerta-personalizada.component';
import { OrdenTrabajoDetallePage } from '../orden-trabajo-detalle/orden-trabajo-detalle.page';
import { BaseListPageComponent } from '../../../components/base-list-page.component';
import {
  BaseListService,
  FilterConfig,
} from '../../../services/base-list.service';

@Component({
  selector: 'app-orden-trabajo-list',
  templateUrl: './orden-trabajo-list.page.html',
  styleUrls: ['./orden-trabajo-list.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, DatePipe],
})
export class OrdenTrabajoListPage
  extends BaseListPageComponent<OrdenTrabajoResumen>
  implements OnInit
{
  private apiService = inject(ApiService);
  private navCtrl = inject(NavController);
  private alertCtrl = inject(AlertController);

  // Filtros específicos
  private _filterStatus: string = '';

  constructor() {
    const baseListService = inject(BaseListService<OrdenTrabajoResumen>);
    const toastController = inject(ToastController);
    const loadingController = inject(LoadingController);
    const modalController = inject(ModalController);
    const titleService = inject(TitleService);

    super(
      baseListService,
      toastController,
      loadingController,
      modalController,
      titleService
    );
  }
  override async ngOnInit() {
    await super.ngOnInit();
  }

  override ionViewWillEnter() {
    super.ionViewWillEnter();
    // Forzar la carga inicial de datos
    this.loadItems();
  }

  // Getters/setters para filtros específicos
  get filterStatus(): string {
    return this._filterStatus;
  }

  set filterStatus(value: string) {
    this._filterStatus = value;
    this.setFilter('estado', value);
  }

  // Implementación de métodos abstractos
  getPageTitle(): string {
    return 'Órdenes de Trabajo';
  }
  getFilterConfig(): FilterConfig<OrdenTrabajoResumen> {
    return {
      searchFields: ['vehiculo.patente', 'vehiculo.modelo'] as any,
      customFilters: {
        estado: (item: OrdenTrabajoResumen, value: string) => {
          // Obtener el estado de forma segura
          const estado = item.estado_ot || (item as any).estadoOt;
          return !value || estado === value;
        },
      },
    };
  }

  async loadData(): Promise<OrdenTrabajoResumen[]> {
    return new Promise((resolve, reject) => {
      this.apiService.getOrdenesTrabajo().subscribe({
        next: (data) => resolve(data),
        error: (error) => reject(error),
      });
    });
  }

  get paginatedOrdenes() {
    return this.paginatedItems;
  }
  async verDetalle(idOt: number) {
    // En lugar de navegar a otra página, abrir un modal
    const modal = await this.modalCtrl.create({
      component: OrdenTrabajoDetallePage,
      componentProps: {
        ordenTrabajoId: idOt,
      },
      cssClass: 'orden-trabajo-modal',
      backdropDismiss: false,
    });

    await modal.present();

    // Manejar el cierre del modal
    const { data } = await modal.onDidDismiss();
    if (data && data.updated) {
      this.loadItems(); // Recargar la lista si se actualizó algo
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
      cancelado: 'Cancelado',
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
  async presentToast(
    message: string,
    color: 'success' | 'warning' | 'danger' | 'medium' = 'medium'
  ) {
    await this.mostrarToast(message, color);
  }

  // Método para abrir formulario de nueva orden (placeholder)
  abrirFormularioNuevaOrden() {
    // TODO: Implementar navegación o modal para crear nueva orden
    this.presentToast('Funcionalidad de nueva orden por implementar', 'medium');
  }

  // Método auxiliar para acceder al estado de forma segura
  getEstadoOT(orden: any): string | undefined {
    // Intentar diferentes formatos de nombres de propiedades
    return orden?.estado_ot || orden?.estadoOt || undefined;
  }
  getEstadoOTColor(orden: any): string {
    const estado = this.getEstadoOT(orden);
    if (!estado) return 'medium';
    return this.getColorForStatus(estado);
  }
}
