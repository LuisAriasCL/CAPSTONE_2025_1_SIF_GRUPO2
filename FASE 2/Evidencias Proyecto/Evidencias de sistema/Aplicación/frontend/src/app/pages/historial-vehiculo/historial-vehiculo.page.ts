// Fichero: src/app/pages/historial-vehiculo/historial-vehiculo.page.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, LoadingController, ToastController, ModalController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent } from 'src/app/componentes/header/header.component';
import { ApiService, HistorialItem, Vehiculo } from 'src/app/services/api.service';
import { OrdenTrabajoDetallePage } from '../maintenance/orden-trabajo-detalle/orden-trabajo-detalle.page';

// --- NUEVO COMPONENTE MODAL PARA VER IMÁGENES ---
@Component({
  selector: 'app-ver-imagen-modal',
  template: `
    <ion-header>
      <ion-toolbar color="dark">
        <ion-title>{{ titulo }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="cerrar()">Cerrar</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding ion-text-center" style="--background: #222;">
      <img [src]="imageUrl" alt="Comprobante o Siniestro" style="max-width: 100%; max-height: 80vh; margin: auto; object-fit: contain;" />
    </ion-content>
  `,
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class VerImagenModal {
  titulo: string = '';
  imageUrl: string = '';
  private modalCtrl = inject(ModalController);
  cerrar() { this.modalCtrl.dismiss(); }
}

// --- CLASE PRINCIPAL DE LA PÁGINA ---
@Component({
  selector: 'app-historial-vehiculo',
  templateUrl: './historial-vehiculo.page.html',
  styleUrls: ['./historial-vehiculo.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, HeaderComponent, DatePipe, CurrencyPipe, TitleCasePipe, VerImagenModal, OrdenTrabajoDetallePage]
})
export class HistorialVehiculoPage implements OnInit {
  private todoElHistorial: HistorialItem[] = [];
  historialFiltrado: HistorialItem[] = [];
  vehiculoActual: Vehiculo | null = null;
  isLoading = true;
  terminoBusqueda: string = '';
  filtroTipo: string = 'todos';

  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);
  private toastController = inject(ToastController);
  private router = inject(Router);
  private modalController = inject(ModalController);

  constructor() {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const vehiculoId = +id;
      this.cargarHistorial(vehiculoId);
      this.cargarDetallesVehiculo(vehiculoId);
    }
  }

  cargarHistorial(vehiculoId: number) {
    this.isLoading = true;
    this.apiService.getHistorialVehiculo(vehiculoId).subscribe({
      next: (data) => {
        this.todoElHistorial = data;
        this.historialFiltrado = data;
        this.isLoading = false;
      },
      error: async (err) => {
        this.isLoading = false;
        const toast = await this.toastController.create({ message: err.message || 'Error al cargar el historial.', duration: 3000, color: 'danger' });
        toast.present();
      }
    });
  }
  
  cargarDetallesVehiculo(vehiculoId: number) {
     this.apiService.getVehicle(vehiculoId).subscribe({
      next: (data) => { this.vehiculoActual = data; },
      error: async (err) => {
        const toast = await this.toastController.create({ message: 'No se pudieron cargar los detalles del vehículo.', duration: 3000, color: 'danger' });
        toast.present();
      }
    });
  }

  filtrarHistorial() {
    let historialTemp = [...this.todoElHistorial];
    if (this.filtroTipo !== 'todos') {
      historialTemp = historialTemp.filter(item => item.tipo === this.filtroTipo);
    }
    const busqueda = this.terminoBusqueda.toLowerCase().trim();
    if (busqueda) {
      historialTemp = historialTemp.filter(item => 
        item.titulo.toLowerCase().includes(busqueda) || 
        item.subtitulo.toLowerCase().includes(busqueda)
      );
    }
    this.historialFiltrado = historialTemp;
  }

   async verDetalle(item: HistorialItem) {
    switch (item.tipo) {
      case 'Mantenimiento':
        // Abre la página de detalle de la OT como un modal
        const modalOt = await this.modalController.create({
          component: OrdenTrabajoDetallePage,
          componentProps: {
             ordenTrabajoId: item.id // Pasa el ID de la OT al modal
          }
        });
        await modalOt.present();
        break;

      case 'Siniestro':
        // Esto ya funciona correctamente
        this.router.navigate(['/siniestro-detalle', item.id]);
        break;
        
      case 'Combustible':
        // Por ahora, mantenemos el modal. Lo cambiaremos en el siguiente paso.
        if (item.urlComprobante) {
          this.abrirModalImagen('Comprobante de Combustible', item.urlComprobante);
        } else {
          this.mostrarToast('Este registro no tiene un comprobante adjunto.');
        }
        break;
    }
  }
  // Helper para abrir el modal
  async abrirModalImagen(titulo: string, url: string) {
    const modal = await this.modalController.create({
      component: VerImagenModal,
      componentProps: {
        titulo: titulo,
        imageUrl: `http://localhost:8101${url}`
      },
      cssClass: 'imagen-modal' // Puedes usar esta clase para estilizar el modal
    });
    await modal.present();
  }
  
  // Helper para mostrar mensajes
  async mostrarToast(mensaje: string, color: 'warning' | 'danger' | 'success' | 'primary' = 'warning') {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2500,
      position: 'bottom',
      color: color
    });
    toast.present();
  }
}