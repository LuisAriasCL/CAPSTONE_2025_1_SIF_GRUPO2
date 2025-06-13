import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonicModule,
  LoadingController,
  ToastController,
  RefresherCustomEvent,
  NavController,
  ModalController,
} from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  pencilOutline,
  trashOutline,
  addCircleOutline,
  settingsOutline,
  searchOutline,
  carOutline,
} from 'ionicons/icons';

// CORREGIDO: Importar ApiService y la NUEVA interfaz Vehiculo y el tipo EstadoVehiculo
// Asegúrate de que Vehiculo y EstadoVehiculo estén EXPORTADOS desde api.service.ts
// o desde un archivo de interfaces dedicado (ej. ../../interfaces/vehiculo.interface.ts)
import {
  ApiService,
  PaginatedVehiculoResponse,
} from '../../services/api.service'; // Importa PaginatedVehiculoResponse
import { PageEvent } from 'src/types/components.types'; // Asegúrate que PageEvent esté bien definida
import {
  Vehiculo,
  EstadoVehiculo,
  ActionButton,
  Column,
} from 'src/types/components.types';
import { HttpErrorResponse } from '@angular/common/http'; // Para tipar errores
// Importamos el componente DataTable y sus interfaces
import { DataTableComponent } from '../../componentes/data-table/data-table.component';

// Importamos el formulario de vehículos para usarlo como modal
import { VehicleFormPage } from '../vehicle-form/vehicle-form.page';

// Importamos el componente de alerta personalizada
import { AlertaPersonalizadaComponent } from '../../componentes/alerta-personalizada/alerta-personalizada.component';

@Component({
  selector: 'app-vehicle-list',
  templateUrl: './vehicle-list.page.html',
  styleUrls: ['./vehicle-list.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, DataTableComponent],
})
export class VehicleListPage implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);
  private modalController = inject(ModalController);
  // private navCtrl = inject(NavController); // Opcional, si prefieres usar NavController

  vehiculos: Vehiculo[] = []; // CORREGIDO: Usar la nueva interfaz Vehiculo
  isLoading = false;
  pageTitle = 'Listado de Vehículos';

  // Paginación y Ordenamiento
  currentPage = 1;
  pageSize = 10; // Sincroniza con el valor por defecto del DataTable y backend
  totalItems = 0; // Vendrá del backend
  totalPages = 0; // Vendrá del backend
  sortColumn = 'idVehi'; // Columna inicial de ordenamiento (debe coincidir con un campo del modelo Vehiculo)
  sortDirection: 'asc' | 'desc' = 'asc'; // Dirección inicial
  filters: any = {}; // Puedes usar un tipo más específico si tienes una interfaz para los filtros

  // Configuración del header
  // Configuración de las columnas para el DataTable
  tableColumns: Column[] = [
    { header: 'Patente', field: 'patente', sortable: true },
    { header: 'Marca', field: 'marca', sortable: true },
    { header: 'Modelo', field: 'modelo', sortable: true },
    { header: 'Año', field: 'anio', sortable: true },
    {
      header: 'Estado',
      field: 'estadoVehi',
      sortable: true,
      cell: (data: Vehiculo) => this.getStatusBadge(data.estadoVehi),
    },
    { header: 'Kilometraje', field: 'kmVehi', sortable: true },
    {
      header: 'Acciones',
      field: 'actions',
      width: '120px',
      isAction: true, // Indicamos que esta columna es para los botones de acción
    },
  ];
  // Configuración de los botones de acción
  actionButtons: ActionButton[] = [
    {
      icon: 'eye-outline',
      color: 'primary',
      tooltip: 'Ver detalles',
      onClick: (row: Vehiculo) => this.goToViewVehicle(row.idVehi),
    },
    {
      icon: 'pencil-outline',
      color: 'primary',
      tooltip: 'Editar vehículo',
      onClick: (row: Vehiculo) => this.goToEditVehicle(row.idVehi),
    },
    {
      icon: 'trash-outline',
      color: 'danger',
      tooltip: 'Eliminar vehículo',
      onClick: (row: Vehiculo) =>
        this.confirmDeleteVehicle(row.idVehi, row.patente),
    },
  ];

  constructor() {
    addIcons({
      pencilOutline,
      trashOutline,
      addCircleOutline,
      settingsOutline,
      searchOutline,
      carOutline,
    });
  }

  ngOnInit() {
    // ionViewWillEnter se encarga de la carga inicial
  }

  ionViewWillEnter() {
    this.loadVehicles(); // La llamada aquí es correcta
  }

  async loadVehicles(showLoading = true, event?: RefresherCustomEvent) {
    let loadingIndicator: HTMLIonLoadingElement | undefined;
    // Solo mostrar el loading global si no es un refresher y no hay otro loader activo
    if (showLoading && !event && !(await this.loadingController.getTop())) {
      this.isLoading = true;
      loadingIndicator = await this.loadingController.create({
        message: 'Cargando vehículos...',
      });
      await loadingIndicator.present();
    } else if (showLoading && !event) {
      // Si ya hay un loader, no hacemos nada con isLoading para no interferir
      showLoading = false; // Evita que se intente cerrar un loader no creado por esta instancia
    }

    // LLAMAR AL MÉTODO PAGINADO DEL SERVICIO
    this.apiService
      .getVehiculosPaginados(
        this.currentPage,
        this.pageSize,
        this.sortColumn,
        this.sortDirection
        // Aquí podrías pasar un objeto de filtros si lo implementas
      )
      .subscribe({
        next: (response: PaginatedVehiculoResponse): void => {
          this.vehiculos = response.data;
          this.totalItems = response.totalItems;
          this.totalPages = response.totalPages;
          // this.currentPage = response.currentPage; // Opcional, si confías en el backend

          if (showLoading && !event) this.isLoading = false;
          if (loadingIndicator) loadingIndicator.dismiss();
          event?.target.complete();
          console.log('Vehículos cargados (paginados):', response);
        },
        error: async (error: any) => {
          console.error('Error al cargar vehículos paginados:', error);
          if (showLoading && !event) this.isLoading = false;
          if (loadingIndicator) loadingIndicator.dismiss();
          event?.target.complete();
          const message =
            error.message || 'No se pudo cargar la lista de vehículos.';
          // Cambiamos presentAlert por modal personalizado
          const modal = await this.modalController.create({
            component: AlertaPersonalizadaComponent,
            componentProps: {
              title: 'Error',
              message: `No se pudo cargar la lista de vehículos. ${message}`,
              icon: 'error',
              buttons: [{ text: 'Aceptar', role: 'confirm' }],
            },
            cssClass: 'custom-alert-modal',
          });
          await modal.present();
        },
      });
  }

  getStatusBadge(estadoVehi: EstadoVehiculo | string | undefined): string {
    const estado = estadoVehi ?? 'desconocido';
    const color = this.getStatusColor(estado);
    // Inyectamos la clase directamente
    return `<ion-badge class="status-${estado}" color="${color}">${estado}</ion-badge>`;
  }

  handleRefresh(event: RefresherCustomEvent) {
    console.log('Recargando lista de vehículos...');
    this.loadVehicles(false, event);
  }
  async goToAddVehicle() {
    // Crear el modal para nuevo vehículo
    console.log('Abriendo modal para nuevo vehículo');
    const modal = await this.modalController.create({
      component: VehicleFormPage,
      cssClass: 'vehicle-form-modal',
    });

    modal.onDidDismiss().then((result) => {
      if (result.data) {
        // Si se creó un vehículo, recargar la lista
        console.log('Vehículo creado:', result.data);
        this.loadVehicles(false);
      }
    });

    return await modal.present();
  }
  // idVehi es la PK de la interfaz Vehiculo (antes era 'id')
  async goToEditVehicle(idVehi?: number) {
    if (idVehi !== undefined) {
      console.log('Abriendo modal para editar vehículo con ID:', idVehi);

      const modal = await this.modalController.create({
        component: VehicleFormPage,
        componentProps: {
          vehicleId: idVehi,
          isEditMode: true,
        },
        cssClass: 'vehicle-form-modal',
      });

      modal.onDidDismiss().then((result) => {
        if (result.data) {
          // Si se actualizó un vehículo, recargar la lista
          console.log('Vehículo actualizado:', result.data);
          this.loadVehicles(false);
        }
      });

      return await modal.present();
    } else {
      this.presentToast('No se especificó un ID para editar.', 'danger');
    }
  }

  async goToViewVehicle(idVehi?: number) {
    if (idVehi !== undefined) {
      console.log('Abriendo modal para ver vehículo con ID:', idVehi);

      const modal = await this.modalController.create({
        component: VehicleFormPage,
        componentProps: {
          vehicleId: idVehi,
          isViewMode: true,
        },
        cssClass: 'vehicle-form-modal',
      });

      return await modal.present();
    } else {
      this.presentToast('No se especificó un ID para visualizar.', 'danger');
    }
  }

  // idVehi es la PK, patente es vehiculo.patente
  async confirmDeleteVehicle(
    idVehi: number | undefined,
    patente: string | undefined
  ) {
    if (idVehi === undefined || patente === undefined) {
      console.error('ID de vehículo o patente indefinidos para eliminar');
      this.presentToast(
        'Error: Datos del vehículo no válidos para eliminar.',
        'danger'
      );
      return;
    }

    // Reemplazamos AlertController por el modal personalizado
    const modal = await this.modalController.create({
      component: AlertaPersonalizadaComponent,
      componentProps: {
        title: 'Confirmar Eliminación',
        message: `¿Seguro que quieres eliminar el vehículo patente <strong>${patente}</strong>?`,
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
      this.deleteVehicle(idVehi);
    }
  }

  private async deleteVehicle(idVehi: number) {
    // idVehi es la PK
    const loading = await this.loadingController.create({
      message: 'Eliminando...',
    });
    await loading.present();

    this.apiService.deleteVehicle(idVehi).subscribe({
      next: async (res: { message: string }) => {
        console.log('Vehículo eliminado:', res.message);
        await loading.dismiss();
        this.presentToast('Vehículo eliminado exitosamente.', 'success');
        this.loadVehicles(false);
      },
      error: async (error: HttpErrorResponse | Error) => {
        await loading.dismiss();
        console.error('Error al eliminar vehículo:', error);
        const message =
          error instanceof HttpErrorResponse
            ? error.error?.message || error.message
            : error.message;

        // Cambiamos presentAlert por modal personalizado
        const modal = await this.modalController.create({
          component: AlertaPersonalizadaComponent,
          componentProps: {
            title: 'Error al Eliminar',
            message: `No se pudo eliminar el vehículo. ${message}`,
            icon: 'error',
            buttons: [{ text: 'Aceptar', role: 'confirm' }],
          },
          cssClass: 'custom-alert-modal',
        });
        await modal.present();
      },
    });
  }

  // El parámetro estado ahora es de tipo EstadoVehiculo
  getStatusColor(estado: EstadoVehiculo | string): string {
    // Permitir string por si acaso, pero idealmente es EstadoVehiculo
    switch (estado) {
      case 'activo':
        return 'success';
      case 'inactivo':
        return 'medium';
      case 'mantenimiento':
        return 'warning';
      case 'taller':
        return 'danger';
      default:
        return 'light';
    }
  }

  // Método para manejar las acciones del header
  onHeaderAction(action: string) {
    switch (action) {
      case 'add':
        this.goToAddVehicle();
        break;
      default:
        console.log('Acción no reconocida:', action);
    }
  }

  async presentAlert(header: string, message: string) {
    // Reemplazamos este método por el modal personalizado
    const modal = await this.modalController.create({
      component: AlertaPersonalizadaComponent,
      componentProps: {
        title: header,
        message: message,
        icon: 'info',
        buttons: [{ text: 'Aceptar', role: 'confirm' }],
      },
      cssClass: 'custom-alert-modal',
    });
    await modal.present();
  }

  async presentToast(
    message: string,
    color: 'success' | 'warning' | 'danger' | 'medium' = 'medium'
  ) {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      position: 'bottom',
      color,
    });
    toast.present();
  }

  // Métodos para la paginación
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      console.log('Cambiando a la página:', this.currentPage);
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      console.log('Cambiando a la página:', this.currentPage);
    }
  }

  // Métodos para DataTable ACTUALIZADOS
  onPageChange(pageEvent: PageEvent) {
    this.currentPage = pageEvent.pageIndex + 1; // DataTable suele ser 0-indexed
    this.pageSize = pageEvent.pageSize;
    this.loadVehicles(false); // Recargar datos del backend
  }

  onSortColumn(sortEvent: { column: string; direction: 'asc' | 'desc' }) {
    this.sortColumn = sortEvent.column;
    this.sortDirection = sortEvent.direction;
    this.currentPage = 1; // Volver a la primera página al cambiar el orden
    this.loadVehicles(false); // Recargar datos del backend
  }

  onRowClick(row: Vehiculo) {
    console.log('Fila seleccionada:', row);
    // No navegamos directamente aquí, dependiendo del contexto podríamos
    // mostrar un modal o navegar a detalles
  }

  // Helper para manejar botones de acción en la tabla
  getActionButtons(
    idVehi: number | undefined,
    patente: string | undefined
  ): string {
    if (idVehi === undefined || patente === undefined) {
      return '<div>ID o patente no disponible</div>';
    }

    return `
      <div class="action-buttons">
        <ion-button fill="clear" size="small" class="view-btn" data-id="${idVehi}">
          <ion-icon name="eye-outline" color="primary"></ion-icon>
        </ion-button>
        <ion-button fill="clear" size="small" class="edit-btn" data-id="${idVehi}">
          <ion-icon name="pencil-outline" color="primary"></ion-icon>
        </ion-button>
        <ion-button fill="clear" size="small" class="delete-btn" data-id="${idVehi}" data-patente="${patente}">
          <ion-icon name="trash-outline" color="danger"></ion-icon>
        </ion-button>
      </div>
    `;
  }

  // Manejador para eventos del DataTable
  handleTableEvent(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const viewBtn = target.closest('.view-btn');
    const editBtn = target.closest('.edit-btn');
    const deleteBtn = target.closest('.delete-btn');

    if (viewBtn) {
      event.stopPropagation(); // Evitar que se active onRowClick
      const idVehi = Number(viewBtn.getAttribute('data-id'));
      if (!isNaN(idVehi)) {
        this.goToViewVehicle(idVehi);
      }
    } else if (editBtn) {
      event.stopPropagation(); // Evitar que se active onRowClick
      const idVehi = Number(editBtn.getAttribute('data-id'));
      if (!isNaN(idVehi)) {
        this.goToEditVehicle(idVehi);
      }
    } else if (deleteBtn) {
      event.stopPropagation(); // Evitar que se active onRowClick
      const idVehi = Number(deleteBtn.getAttribute('data-id'));
      const patente = deleteBtn.getAttribute('data-patente');
      if (!isNaN(idVehi) && patente) {
        this.confirmDeleteVehicle(idVehi, patente);
      }
    }
  }

  // Método que se ejecuta después de que la vista se inicializa
  ionViewDidEnter() {
    // Agregar listener para eventos de botones en el DataTable
    document.addEventListener('click', this.handleTableEvent.bind(this));
  }

  // Método que se ejecuta cuando la vista se va a abandonar
  ionViewWillLeave() {
    // Limpiar listener al salir para evitar memory leaks
    document.removeEventListener('click', this.handleTableEvent.bind(this));
  }

  onExport(format: 'excel' | 'pdf') {
    console.log('Exportar en formato:', format);
    // Idealmente, mostrar un indicador de carga
    this.apiService
      .exportVehiculos(
        format,
        this.sortColumn,
        this.sortDirection,
        this.filters
      )
      .subscribe({
        next: (blob) => {
          console.log('Archivo listo para descargar:', blob);
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `vehiculos_export.${
            format === 'excel' ? 'xlsx' : 'pdf'
          }`; // Extensión correcta
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
        },
        error: (err) => {
          console.error(`Error al exportar a ${format}:`, err);
          this.presentToast(
            `Error al exportar a ${format}. ${err.message || ''}`,
            'danger'
          );
        },
      });
  }

  onImport(format: string): void {
    console.log(`Importar usando formato: ${format}`);
    // Aquí iría la lógica para seleccionar archivo y enviarlo al backend
    // El backend procesaría el archivo y guardaría los datos.
  }
}
