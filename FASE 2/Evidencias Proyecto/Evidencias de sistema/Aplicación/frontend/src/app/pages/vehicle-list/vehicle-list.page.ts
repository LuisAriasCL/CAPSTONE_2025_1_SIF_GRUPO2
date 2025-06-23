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
// CAMBIO 1: Añadir el nuevo icono 'newspaperOutline' y 'eyeOutline'
import {
  pencilOutline,
  trashOutline,
  addCircleOutline,
  settingsOutline,
  searchOutline,
  carOutline,
  eyeOutline,
  newspaperOutline,
  add,
} from 'ionicons/icons';

import {
  ApiService,
  Vehiculo,
  EstadoVehiculo,
} from '../../services/api.service';
import { HttpErrorResponse } from '@angular/common/http';
import { TitleService } from '../../services/title.service';

import {
  DataTableComponent,
  Column,
  PageEvent,
  ActionButton,
} from '../../componentes/data-table/data-table.component';
import { VehicleFormPage } from '../vehicle-form/vehicle-form.page';
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
  private titleService = inject(TitleService);

  vehiculos: Vehiculo[] = [];
  isLoading = false;

  pageTitle = 'Listado de Vehículos';
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

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
    {
      header: 'Kilometraje',
      field: 'kmVehi',
      sortable: true,
      cell: (data: Vehiculo) => `${data.kmVehi.toLocaleString('es-CL')} km`,
    },
    {
      header: 'Acciones',
      field: 'actions',
      width: '150px', // Aumentamos un poco el ancho para el nuevo botón
      isAction: true,
    },
  ];

  // CAMBIO 2: Añadir el nuevo botón de historial al array de acciones
  actionButtons: ActionButton[] = [
    {
      icon: 'eye-outline',
      color: 'primary',
      tooltip: 'Ver detalles',
      onClick: (row: Vehiculo) => this.goToViewVehicle(row.idVehi),
    },
    {
      icon: 'newspaper-outline',
      color: 'success', // Un color distintivo
      tooltip: 'Ver historial',
      onClick: (row: Vehiculo) => this.verHistorial(row.idVehi),
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
      eyeOutline,
      newspaperOutline,
      add,
    });
  }

  ngOnInit() {
    this.titleService.setTitle('Gestión de Vehículos');
  }

  ionViewWillEnter() {
    this.loadVehicles();
  }

  async loadVehicles(showLoading = true, event?: RefresherCustomEvent) {
    let loadingIndicator: HTMLIonLoadingElement | undefined;
    if (showLoading && !event && !(await this.loadingController.getTop())) {
      this.isLoading = true;
      loadingIndicator = await this.loadingController.create({
        message: 'Cargando vehículos...',
      });
      await loadingIndicator.present();
    } else if (showLoading && !event) {
      showLoading = false;
    }

    this.apiService.getVehicles().subscribe({
      next: (data: Vehiculo[]) => {
        this.vehiculos = data;
        this.totalPages = Math.ceil(this.vehiculos.length / this.pageSize);
        if (showLoading && !event) this.isLoading = false;
        if (loadingIndicator) loadingIndicator.dismiss();
        event?.target.complete();
      },
      error: async (error: HttpErrorResponse | Error) => {
        console.error('Error al cargar vehículos:', error);
        if (showLoading && !event) this.isLoading = false;
        if (loadingIndicator) loadingIndicator.dismiss();
        event?.target.complete();
        const message =
          error instanceof HttpErrorResponse
            ? error.error?.message || error.message
            : error.message;

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
    const estadoCapitalized = estado.charAt(0).toUpperCase() + estado.slice(1);
    return `<ion-badge color="${color}">${estadoCapitalized}</ion-badge>`;
  }

  handleRefresh(event: RefresherCustomEvent) {
    this.loadVehicles(false, event);
  }

  async goToAddVehicle() {
    const modal = await this.modalController.create({
      component: VehicleFormPage,
      cssClass: 'vehicle-form-modal',
    });

    modal.onDidDismiss().then((result) => {
      if (result.data) {
        this.loadVehicles(false);
      }
    });

    return await modal.present();
  }

  async goToEditVehicle(idVehi?: number) {
    if (idVehi !== undefined) {
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

  // CAMBIO 3: Añadir el método para ver el historial
  verHistorial(idVehi?: number) {
    if (idVehi !== undefined) {
      this.router.navigate(['/historial-vehiculo', idVehi]);
    } else {
      this.presentToast(
        'No se especificó un ID para ver el historial.',
        'danger'
      );
    }
  }

  async confirmDeleteVehicle(
    idVehi: number | undefined,
    patente: string | undefined
  ) {
    if (idVehi === undefined || patente === undefined) {
      this.presentToast(
        'Error: Datos del vehículo no válidos para eliminar.',
        'danger'
      );
      return;
    }

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
    const loading = await this.loadingController.create({
      message: 'Eliminando...',
    });
    await loading.present();

    this.apiService.deleteVehicle(idVehi).subscribe({
      next: async (res: { message: string }) => {
        await loading.dismiss();
        this.presentToast('Vehículo eliminado exitosamente.', 'success');
        this.loadVehicles(false);
      },
      error: async (error: HttpErrorResponse | Error) => {
        await loading.dismiss();
        const message =
          error instanceof HttpErrorResponse
            ? error.error?.message || error.message
            : error.message;

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

  getStatusColor(estado: EstadoVehiculo | string): string {
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

  // CAMBIO 4: Añadir implementación a los métodos que necesita la tabla para no dar error
  onPageChange(event: PageEvent) {
    console.log('Cambio de página:', event);
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
  }

  onRowClick(row: Vehiculo) {
    console.log('Fila seleccionada:', row);
  }

  onSortColumn(event: { column: string; direction: 'asc' | 'desc' }) {
    console.log('Ordenar por:', event);
  }

  onExport(format: string) {
    console.log('Exportar en formato:', format);
    this.presentToast(
      `Funcionalidad de exportar a ${format} no implementada.`,
      'warning'
    );
  }

  onImport(format: string) {
    console.log('Importar desde formato:', format);
    this.presentToast(
      `Funcionalidad de importar desde ${format} no implementada.`,
      'warning'
    );
  }
}
