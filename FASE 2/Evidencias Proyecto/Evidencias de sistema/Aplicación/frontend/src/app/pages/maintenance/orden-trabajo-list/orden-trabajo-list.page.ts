import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, LoadingController } from '@ionic/angular';
import { ApiService, OrdenTrabajoResumen } from 'src/app/services/api.service';

@Component({
  selector: 'app-orden-trabajo-list',
  templateUrl: './orden-trabajo-list.page.html',
  styleUrls: ['./orden-trabajo-list.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, DatePipe, TitleCasePipe]
})
export class OrdenTrabajoListPage implements OnInit {

  ordenes: OrdenTrabajoResumen[] = [];
  isLoading: boolean = false;

  constructor(
    private apiService: ApiService,
    private navCtrl: NavController,
    private loadingCtrl: LoadingController
  ) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.cargarOrdenes();
  }

  async cargarOrdenes(event?: any) {
    if (!event) {
      this.isLoading = true;
    }

    this.apiService.getOrdenesTrabajo().subscribe({
      next: (data) => {
        this.ordenes = data;
        this.isLoading = false;
        if (event) {
          event.target.complete();
        }
      },
      error: (error) => {
        console.error('Error al cargar las órdenes de trabajo', error);
        this.isLoading = false;
        if (event) {
          event.target.complete();
        }
        
      }
    });
  }

  verDetalle(idOt: number) {
    this.navCtrl.navigateForward(`/orden-trabajo-detalle/${idOt}`);
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
}