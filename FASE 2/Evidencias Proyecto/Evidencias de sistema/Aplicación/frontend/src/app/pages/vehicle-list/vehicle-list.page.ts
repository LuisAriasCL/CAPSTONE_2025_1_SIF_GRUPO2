import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, LoadingController, AlertController, ToastController, RefresherCustomEvent, NavController, ModalController } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { pencilOutline, trashOutline, addCircleOutline, settingsOutline, searchOutline, carOutline } from 'ionicons/icons';

// CORREGIDO: Importar ApiService y la NUEVA interfaz Vehiculo y el tipo EstadoVehiculo
// Asegúrate de que Vehiculo y EstadoVehiculo estén EXPORTADOS desde api.service.ts
// o desde un archivo de interfaces dedicado (ej. ../../interfaces/vehiculo.interface.ts)
import { ApiService, Vehiculo, EstadoVehiculo } from '../../services/api.service';
import { HttpErrorResponse } from '@angular/common/http'; // Para tipar errores

// Importamos el componente DataTable y sus interfaces
import { DataTableComponent, Column, PageEvent, ActionButton } from '../../componentes/data-table/data-table.component';

// Importamos el formulario de vehículos para usarlo como modal
import { VehicleFormPage } from '../vehicle-form/vehicle-form.page';

@Component({  
  selector: 'app-vehicle-list',
  templateUrl: './vehicle-list.page.html',
  styleUrls: ['./vehicle-list.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, DataTableComponent]
})
export class VehicleListPage implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);
  private modalController = inject(ModalController);
  // private navCtrl = inject(NavController); // Opcional, si prefieres usar NavController

  vehiculos: Vehiculo[] = []; // CORREGIDO: Usar la nueva interfaz Vehiculo
  isLoading = false;

  // Configuración del header
  pageTitle = 'Listado de Vehículos';
  // Paginación
  currentPage = 1;
  pageSize = 10;
  totalPages = 1; // Se actualizará según la cantidad de vehículos
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
      cell: (data: Vehiculo) => this.getStatusBadge(data.estadoVehi)
    },
    { header: 'Kilometraje', field: 'kmVehi', sortable: true },
    { 
      header: 'Acciones', 
      field: 'actions',
      width: '120px',
      isAction: true // Indicamos que esta columna es para los botones de acción
    }
  ];
  // Configuración de los botones de acción
  actionButtons = [
    {
      icon: 'pencil-outline',
      color: 'primary',
      tooltip: 'Editar vehículo',
      onClick: (row: Vehiculo) => this.goToEditVehicle(row.idVehi)
    },
    {
      icon: 'trash-outline',
      color: 'danger',
      tooltip: 'Eliminar vehículo',
      onClick: (row: Vehiculo) => this.confirmDeleteVehicle(row.idVehi, row.patente)
    }
  ];

  constructor() {
    addIcons({ pencilOutline, trashOutline, addCircleOutline, settingsOutline, searchOutline, carOutline });
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
      loadingIndicator = await this.loadingController.create({ message: 'Cargando vehículos...' });
      await loadingIndicator.present();
    } else if (showLoading && !event) {
      // Si ya hay un loader, no hacemos nada con isLoading para no interferir
      showLoading = false; // Evita que se intente cerrar un loader no creado por esta instancia
    }


    this.apiService.getVehicles().subscribe({ // getVehicles ahora devuelve Observable<Vehiculo[]>
      next: (data: Vehiculo[]) => { // data es ahora Vehiculo[]
        this.vehiculos = data;
        this.totalPages = Math.ceil(this.vehiculos.length / this.pageSize); // Actualizar total de páginas
        if (showLoading && !event) this.isLoading = false;
        if (loadingIndicator) loadingIndicator.dismiss(); // Solo cerrar si lo creamos aquí
        event?.target.complete();
        console.log('Vehículos cargados:', this.vehiculos);
      },
      error: async (error: HttpErrorResponse | Error) => { // Tipar el error
        console.error('Error al cargar vehículos:', error);
        if (showLoading && !event) this.isLoading = false;
        if (loadingIndicator) loadingIndicator.dismiss();
        event?.target.complete();
        const message = (error instanceof HttpErrorResponse) ? (error.error?.message || error.message) : error.message;
        await this.presentAlert('Error', `No se pudo cargar la lista de vehículos. ${message}`);
      }
    });
  }


  getStatusBadge(estadoVehi: EstadoVehiculo|string|undefined): string {
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
      cssClass: 'vehicle-form-modal'
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
          isEditMode: true
        },
        cssClass: 'vehicle-form-modal'
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

  // idVehi es la PK, patente es vehiculo.patente
  async confirmDeleteVehicle(idVehi: number | undefined, patente: string | undefined) {
    if (idVehi === undefined || patente === undefined) {
      console.error('ID de vehículo o patente indefinidos para eliminar');
      this.presentToast('Error: Datos del vehículo no válidos para eliminar.', 'danger');
      return;
    }
    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: `¿Seguro que quieres eliminar el vehículo patente ${patente}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', cssClass: 'danger', handler: () => this.deleteVehicle(idVehi) }
      ]
    });
    await alert.present();
  }

  private async deleteVehicle(idVehi: number) { // idVehi es la PK
    const loading = await this.loadingController.create({ message: 'Eliminando...' });
    await loading.present();

    this.apiService.deleteVehicle(idVehi).subscribe({
      next: async (res: { message: string }) => { // Tipar la respuesta
        console.log('Vehículo eliminado:', res.message);
        await loading.dismiss();
        this.presentToast('Vehículo eliminado exitosamente.', 'success');
        // CORREGIDO: Llamada correcta a loadVehicles para recargar la lista
        this.loadVehicles(false);
      },
      error: async (error: HttpErrorResponse | Error) => { // Tipar el error
        await loading.dismiss();
        console.error('Error al eliminar vehículo:', error);
        const message = (error instanceof HttpErrorResponse) ? (error.error?.message || error.message) : error.message;
        await this.presentAlert('Error al Eliminar', `No se pudo eliminar el vehículo. ${message}`);
      }
    });
  }

  // El parámetro estado ahora es de tipo EstadoVehiculo
  getStatusColor(estado: EstadoVehiculo | string): string { // Permitir string por si acaso, pero idealmente es EstadoVehiculo
    switch (estado) {
      case 'activo': return 'success';
      case 'inactivo': return 'medium';
      case 'mantenimiento': return 'warning';
      case 'taller': return 'danger';
      default: return 'light';
    }  }

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
    const alert = await this.alertController.create({ header, message, buttons: ['OK'] });
    await alert.present();
  }
  async presentToast(message: string, color: 'success' | 'warning' | 'danger' | 'medium' = 'medium') {
    const toast = await this.toastController.create({ message, duration: 2500, position: 'bottom', color });
    toast.present();
  }

  // Métodos para la paginación
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  // Métodos para DataTable
  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex + 1; // El DataTable usa pageIndex basado en 0
    this.pageSize = event.pageSize;
    // Si la paginación es en servidor, aquí se haría una llamada API
  }

  onRowClick(row: Vehiculo) {
    console.log('Fila seleccionada:', row);
    // No navegamos directamente aquí, dependiendo del contexto podríamos
    // mostrar un modal o navegar a detalles
  }

  // Manejador para eventos del DataTable
  handleTableEvent(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const editBtn = target.closest('.edit-btn');
    const deleteBtn = target.closest('.delete-btn');
    
    if (editBtn) {
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

  onSortColumn(event: {column: string, direction: 'asc' | 'desc'}) {
    console.log('Ordenar por:', event);
    // Aquí podríamos implementar la lógica de ordenamiento
    // Si es en servidor, se haría una llamada API con los parámetros de ordenamiento
  }
  onExport(format: string) {
    console.log('Exportar en formato:', format);
    // Aquí implementaríamos la lógica para exportar los datos
    // Por ejemplo, usar una biblioteca como ExcelJS para Excel o jsPDF para PDF
  }

  onImport(format: string) {
    console.log('Importar desde formato:', format);
    // Aquí implementaríamos la lógica para importar datos
    // Por ejemplo, abrir un selector de archivos y procesar el archivo seleccionado
    this.presentToast('Funcionalidad de importación en desarrollo', 'warning');
  }

  // Helper para manejar botones de acción en la tabla
  getActionButtons(idVehi: number | undefined, patente: string | undefined): string {
    if (idVehi === undefined || patente === undefined) {
      return '<div>ID o patente no disponible</div>';
    }
    
    return `
      <div class="action-buttons">
        <ion-button fill="clear" size="small" class="edit-btn" data-id="${idVehi}">
          <ion-icon name="pencil-outline" color="primary"></ion-icon>
        </ion-button>
        <ion-button fill="clear" size="small" class="delete-btn" data-id="${idVehi}" data-patente="${patente}">
          <ion-icon name="trash-outline" color="danger"></ion-icon>
        </ion-button>
      </div>
    `;
  }
}