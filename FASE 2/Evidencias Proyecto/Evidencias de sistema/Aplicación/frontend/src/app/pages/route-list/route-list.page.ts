import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, LoadingController, AlertController, ToastController, RefresherCustomEvent } from '@ionic/angular';
import { Router, RouterLink } from '@angular/router'; 
import { addIcons } from 'ionicons';
import { navigateOutline, pencilOutline, trashOutline, addCircleOutline, add, playCircleOutline } from 'ionicons/icons';

import { ApiService, Route } from '../../services/api.service'; 
import { SidebarComponent } from '../../componentes/sidebar/sidebar.component'; 
import { SocketService } from '../../services/socket.service'; 
@Component({
  selector: 'app-route-list',
  templateUrl: './route-list.page.html',
  styleUrls: ['./route-list.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, SidebarComponent, RouterLink] // Añadir imports
})
export class RouteListPage implements OnInit {

  // Inyección de dependencias (estilo moderno)
  private apiService = inject(ApiService);
  private router = inject(Router);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);
  private socketService = inject(SocketService);

  // Propiedades del componente
  routes: Route[] = [];
  isLoading = false;

  constructor() {
    addIcons({ navigateOutline, pencilOutline, trashOutline, addCircleOutline, add, playCircleOutline }); // Registra todos los usados en el HTML de esta página
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
        // Mostrar error al usuario
        const alert = await this.alertController.create({
            header: 'Error',
            message: 'No se pudo cargar la lista de rutas. ' + error.message,
            buttons: ['OK']
        });
        await alert.present();
      }
    });
  }

   // --- Manejo del Refresher ---
   handleRefresh(event: RefresherCustomEvent) {
      console.log('Recargando lista de rutas...');
      this.loadRoutes(event);
   }


  // --- Navegación ---
  goToAddRoute() {
    console.log('Navegando a /rutas/new');
    this.router.navigateByUrl('/rutas/new'); 
  }
  
  // Este método se llama desde el ion-item-option del lápiz
  editRoute(id: number) {
    console.log('Navegando a /rutas/edit/' + id);
    this.router.navigate(['/rutas/edit', id]); 
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


  // El método viewRouteDetail puede quedarse como está o también navegar a editar/ver
  viewRouteDetail(id: number) {
     console.log('Navegando a ver/editar detalle ruta:', id);
     // Podrías navegar a editar directamente también desde aquí
     this.router.navigate(['/rutas/edit', id]);
     // this.presentToast(`Funcionalidad "Ver Detalle ${id}" no implementada aún.`, 'warning'); // <--- QUITAR
  }

  // --- Eliminación ---
  async confirmDeleteRoute(id: number, name: string) {
    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: `¿Estás seguro de que quieres eliminar la ruta "${name}"? Esta acción no se puede deshacer.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
        }, {
          text: 'Eliminar',
          cssClass: 'danger',
          handler: () => {
            this.deleteRoute(id); 
          }
        }
      ]
    });
    await alert.present();
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
          const alert = await this.alertController.create({
              header: 'Error al Eliminar',
              message: 'No se pudo eliminar la ruta. ' + error.message,
              buttons: ['OK']
          });
          await alert.present();
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