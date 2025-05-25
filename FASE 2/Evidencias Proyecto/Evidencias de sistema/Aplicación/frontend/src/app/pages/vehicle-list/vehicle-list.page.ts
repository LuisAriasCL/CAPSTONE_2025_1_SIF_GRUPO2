import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, TitleCasePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, LoadingController, AlertController, ToastController, RefresherCustomEvent, NavController } from '@ionic/angular'; // NavController puede ser útil
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { pencilOutline, trashOutline, addCircleOutline, settingsOutline, searchOutline, carOutline } from 'ionicons/icons';

// CORREGIDO: Importar ApiService y la NUEVA interfaz Vehiculo y el tipo EstadoVehiculo
// Asegúrate de que Vehiculo y EstadoVehiculo estén EXPORTADOS desde api.service.ts
// o desde un archivo de interfaces dedicado (ej. ../../interfaces/vehiculo.interface.ts)
import { ApiService, Vehiculo, EstadoVehiculo } from '../../services/api.service';
import { HttpErrorResponse } from '@angular/common/http'; // Para tipar errores

@Component({
  selector: 'app-vehicle-list',
  templateUrl: './vehicle-list.page.html',
  styleUrls: ['./vehicle-list.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TitleCasePipe, DecimalPipe]
})
export class VehicleListPage implements OnInit {

  private apiService = inject(ApiService);
  private router = inject(Router);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);
  // private navCtrl = inject(NavController); // Opcional, si prefieres usar NavController

  vehiculos: Vehiculo[] = []; // CORREGIDO: Usar la nueva interfaz Vehiculo
  isLoading = false;

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

  handleRefresh(event: RefresherCustomEvent) {
    console.log('Recargando lista de vehículos...');
    this.loadVehicles(false, event);
  }

  goToAddVehicle() {
    // Asegúrate que esta ruta coincida con la definición en tu app.routes.ts para el formulario
    console.log('Navegando a /vehicle-form (para nuevo vehículo)');
    this.router.navigateByUrl('/vehicle-form');
  }

  // idVehi es la PK de la interfaz Vehiculo (antes era 'id')
  goToEditVehicle(idVehi?: number) {
    if (idVehi !== undefined) {
      console.log('Navegando a /vehicle-form/edit/' + idVehi);
      // Asegúrate que esta ruta coincida con la definición para editar en tu app.routes.ts
      this.router.navigate(['/vehiculos/edit', idVehi]);
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
}