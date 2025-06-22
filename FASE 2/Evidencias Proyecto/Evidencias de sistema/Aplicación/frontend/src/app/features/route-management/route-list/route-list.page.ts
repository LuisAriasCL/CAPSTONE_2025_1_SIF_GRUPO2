import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, UpperCasePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, LoadingController, AlertController, ToastController, RefresherCustomEvent, ModalController } from '@ionic/angular';
import { Router, RouterLink } from '@angular/router'; 
import { addIcons } from 'ionicons';
import { navigateOutline, pencilOutline, trashOutline, addCircleOutline, add, playCircleOutline, eyeOutline, createOutline, documentTextOutline, locationOutline, speedometerOutline, gitNetworkOutline } from 'ionicons/icons';

import { ApiService } from 'src/app/core/services';
import { Route } from 'src/app/core/services';
import { SocketService } from 'src/app/core/services/socket.service';
import { RouteFormPage } from '../route-form/route-form.page';
import { AlertaPersonalizadaComponent } from 'src/app/shared';
import { PageHeaderComponent } from 'src/app/shared';

@Component({
  selector: 'app-route-list',
  templateUrl: './route-list.page.html',
  styleUrls: ['./route-list.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, UpperCasePipe, DecimalPipe, AlertaPersonalizadaComponent, PageHeaderComponent]
})
export class RouteListPage implements OnInit {
  // Inyección de dependencias (estilo moderno)
  private apiService = inject(ApiService);
  private router = inject(Router);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);
  private socketService = inject(SocketService);
  private modalController = inject(ModalController);

  // Propiedades del componente
  routes: Route[] = [];
  isLoading = false;

  constructor() {
    addIcons({ 
      navigateOutline, pencilOutline, trashOutline, addCircleOutline, add, playCircleOutline,
      eyeOutline, createOutline, documentTextOutline, locationOutline, speedometerOutline, gitNetworkOutline
    }); // Registra todos los usados en el HTML de esta página
}

  ngOnInit() {
    
  }

  ionViewWillEnter() {
    this.loadRoutes();
  }

  // --- Carga de Datos ---
  async loadRoutes(event?: RefresherCustomEvent) {
    this.isLoading = true;
    // Mostrar loading solo si no es por el refresher
    let loadingIndicator: HTMLIonLoadingElement | undefined;
    if (!event) {
       loadingIndicator = await this.loadingController.create({ message: 'Cargando rutas...' });
       await loadingIndicator.present();
    }

    this.apiService.getRoutes().subscribe({
      next: (data) => {
        this.routes = data;
        this.isLoading = false;
        loadingIndicator?.dismiss(); 
        event?.target.complete(); 
        console.log('Rutas cargadas:', this.routes);
      },
      error: async (error) => {
        console.error('Error al cargar rutas:', error);
        this.isLoading = false;
        loadingIndicator?.dismiss();
         event?.target.complete();
        
        const modal = await this.modalController.create({
          component: AlertaPersonalizadaComponent,
          componentProps: {
            title: 'Error',
            message: 'No se pudo cargar la lista de rutas. ' + error.message,
            icon: 'error',
            buttons: [{ text: 'Aceptar', role: 'confirm' }]
          },
          cssClass: 'custom-alert-modal'
        });
        await modal.present();
      }
    });
  }

   // --- Manejo del Refresher ---
   handleRefresh(event: RefresherCustomEvent) {
      console.log('Recargando lista de rutas...');
      this.loadRoutes(event);
   }

  // --- Navegación ---
  async goToAddRoute() {
    console.log('Abriendo modal para crear nueva ruta');
    
    const modal = await this.modalController.create({
      component: RouteFormPage,
      backdropDismiss: false,
      showBackdrop: true,
      cssClass: 'route-form-modal'
    });

    modal.onDidDismiss().then((result) => {
      if (result.data?.routeCreated) {
        console.log('Ruta creada exitosamente, recargando lista');
        this.loadRoutes();
        this.presentToast('Ruta creada exitosamente', 'success');
      }
    });

    return await modal.present();
  }
    // Este método se llama desde el ion-item-option del lápiz
  async editRoute(id: number) {
    console.log('Abriendo modal para editar ruta ID:', id);
    
    const modal = await this.modalController.create({
      component: RouteFormPage,
      backdropDismiss: false,
      showBackdrop: true,
      cssClass: 'route-form-modal',
      componentProps: {
        routeId: id,
        isEditMode: true
      }
    });

    modal.onDidDismiss().then((result) => {
      if (result.data && result.data.routeCreated) {
        console.log('Ruta editada exitosamente');
        this.loadRoutes(); // Recargar la lista
      }
    });

    return await modal.present();
  }
  startRouteSimulation(routeId: number, routeName: string) {
    console.log(`Solicitando iniciar simulación para Ruta ID: ${routeId}, Nombre: "${routeName}"`);

    // Definir el ID del vehículo a simular 
    const vehicleIdToUse = 1; 
  

    // Emitir el evento 'startSimulation' al backend
    this.socketService.emit('startSimulation', {
      routeId: routeId,
      vehicleId: vehicleIdToUse
    });

    // Mensaje al usuario
    this.presentToast(`Iniciando simulación para "${routeName}" con vehículo ${vehicleIdToUse}. Ve al mapa.`, 'success');

    // Navegar automáticamente a la página del mapa
    this.router.navigateByUrl('/recorridos'); 
  }
  // --- Fin del método a añadir ---

  // El método viewRouteDetail ahora también usa modal para consistencia
  async viewRouteDetail(id: number) {
    console.log('Abriendo modal para ver/editar detalle ruta:', id);
    
    const modal = await this.modalController.create({
      component: RouteFormPage,
      backdropDismiss: false,
      showBackdrop: true,
      cssClass: 'route-form-modal',
      componentProps: {
        routeId: id,
        isEditMode: true
      }
    });

    modal.onDidDismiss().then((result) => {
      if (result.data && result.data.routeCreated) {
        console.log('Ruta actualizada exitosamente');
        this.loadRoutes(); // Recargar la lista
      }
    });

    return await modal.present();
  }

  // --- Eliminación ---
  async confirmDeleteRoute(id: number, name: string) {
    const modal = await this.modalController.create({
      component: AlertaPersonalizadaComponent,
      componentProps: {
        title: 'Confirmar Eliminación',
        message: `¿Estás seguro de que quieres eliminar la ruta "<strong>${name}</strong>"? Esta acción no se puede deshacer.`,
        icon: 'warning',
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
      this.deleteRoute(id); 
    }
  }

  private async deleteRoute(id: number) {
    const loading = await this.loadingController.create({ message: 'Eliminando...' });
    await loading.present();

    this.apiService.deleteRoute(id).subscribe({
      next: async (res) => {
        console.log('Ruta eliminada:', res.message);
        await loading.dismiss();
        this.presentToast('Ruta eliminada exitosamente.', 'success');
        this.loadRoutes(); 
      },
      error: async (error) => {
         await loading.dismiss();
         console.error('Error al eliminar ruta:', error);
         
         const modal = await this.modalController.create({
          component: AlertaPersonalizadaComponent,
          componentProps: {
            title: 'Error al Eliminar',
            message: 'No se pudo eliminar la ruta. ' + error.message,
            icon: 'error',
            buttons: [{ text: 'Aceptar', role: 'confirm' }]
          },
          cssClass: 'custom-alert-modal'
        });
        await modal.present();
      }
    });
  }

  
  async presentToast(message: string, color: 'success' | 'warning' | 'danger' | 'medium' = 'medium') {
     const toast = await this.toastController.create({
       message: message,
       duration: 2500,
       position: 'bottom',
       color: color
     });
     toast.present();
  }

}