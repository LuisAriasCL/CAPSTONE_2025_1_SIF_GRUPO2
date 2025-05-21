import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, TitleCasePipe, DecimalPipe } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { IonicModule, LoadingController, AlertController, ToastController, RefresherCustomEvent } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { pencilOutline, trashOutline, addCircleOutline, settingsOutline, searchOutline, carOutline } from 'ionicons/icons'; // Añadir iconos necesarios

import { ApiService, Vehicle } from '../../services/api.service'; 

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

  vehicles: Vehicle[] = [];
  isLoading = false;
  

  constructor() {
      addIcons({ pencilOutline, trashOutline, addCircleOutline, settingsOutline, searchOutline, carOutline });
  }

  ngOnInit() {
    
  }

  ionViewWillEnter() {
     this.loadVehicles(); 
  }

  async loadVehicles(showLoading = true, event?: RefresherCustomEvent) {
    this.isLoading = showLoading; 
    let loadingIndicator: HTMLIonLoadingElement | undefined;
    if (showLoading && !event) { 
       loadingIndicator = await this.loadingController.create({ message: 'Cargando vehículos...' });
       await loadingIndicator.present();
    }

    this.apiService.getVehicles().subscribe({
      next: (data) => {
        this.vehicles = data;
        this.isLoading = false;
        loadingIndicator?.dismiss();
        event?.target.complete();
        console.log('Vehículos cargados:', this.vehicles);
      },
      error: async (error) => {
        console.error('Error al cargar vehículos:', error);
        this.isLoading = false;
        loadingIndicator?.dismiss();
        event?.target.complete();
        await this.presentAlert('Error', 'No se pudo cargar la lista de vehículos.');
      }
    });
  }

  // Manejo del Refresher
   handleRefresh(event: RefresherCustomEvent) {
      console.log('Recargando lista de vehículos...');
      this.loadVehicles(false, event); 
   }

   // --- Acciones ---
   goToAddVehicle() {
    console.log('Navegando a /vehiculos/new');
    this.router.navigateByUrl('/vehiculos/new'); 
    
 }

 goToEditVehicle(id?: number) { 
    if (id) {
       console.log('Navegando a /vehiculos/edit/' + id);
       this.router.navigate(['/vehiculos/edit', id]); 
      
    } else {
         this.presentToast('No se especificó un ID para editar.', 'danger'); 
    }
 }

   async confirmDeleteVehicle(id: number, plate: string) {
    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: `¿Seguro que quieres eliminar el vehículo patente ${plate}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', cssClass: 'danger', handler: () => this.deleteVehicle(id) }
      ]
    });
    await alert.present();
  }
  private async deleteVehicle(id: number) {
    const loading = await this.loadingController.create({ message: 'Eliminando...' });
    await loading.present();

    this.apiService.deleteVehicle(id).subscribe({
      next: async (res) => { 
        console.log('Vehículo eliminado:', res.message);
        await loading.dismiss();
        this.presentToast('Vehículo eliminado exitosamente.', 'success');
  
        this.loadVehicles(); 
      },
      error: async (error) => {
         await loading.dismiss();
         console.error('Error al eliminar vehículo:', error);
          const alert = await this.alertController.create({
              header: 'Error al Eliminar',
              message: 'No se pudo eliminar el vehículo. ' + error.message,
              buttons: ['OK']
          });
          await alert.present();
      }
    });
  }

  
  getStatusColor(status: string): string {
     switch(status) {
        case 'activo': return 'success';
        case 'inactivo': return 'medium';
        case 'mantenimiento': return 'warning';
        case 'taller': return 'danger';
        default: return 'light';
     }
  }


  async presentAlert(header: string, message: string) { /* ... como estaba ... */ }
  async presentToast(message: string, color: 'success' | 'warning' | 'danger' | 'medium' = 'medium') { /* ... como estaba ... */ }

}