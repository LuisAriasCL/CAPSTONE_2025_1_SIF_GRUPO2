import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ViewWillEnter } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { ApiService, OrdenTrabajoResumen } from 'src/app/services/api.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-servicios-tecnico',
  templateUrl: './servicios-tecnico.page.html',
  styleUrls: ['./servicios-tecnico.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class ServiciosTecnicoPage implements ViewWillEnter {
  ordenes: OrdenTrabajoResumen[] = [];
  isLoading = true;

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ionViewWillEnter() {
    this.cargarOrdenes();
  }

  cargarOrdenes(event?: any) {
    this.isLoading = true;
    const usuario = this.authService.getCurrentUser();
    if (!usuario) {
      console.error('Usuario no encontrado.');
      this.isLoading = false;
      event?.target.complete();
      return;
    }

    this.apiService.getOrdenesParaTecnico(usuario.idUsu).subscribe({
      next: (data: OrdenTrabajoResumen[]) => {
        this.ordenes = data;
        this.isLoading = false;
        event?.target.complete();
      },
      error: (err) => {
        console.error('Error al cargar las órdenes:', err);
        this.isLoading = false;
        event?.target.complete();
      }
    });
  }

  handleRefresh(event: any) {
    this.cargarOrdenes(event);
  }

  // Método para obtener el color del estado
  getEstadoColor(estado: string): string {
    console.log('Estado recibido:', estado); // Verifica el valor del estado
    switch (estado.toLowerCase().trim()) { // Asegúrate de que esté en minúsculas y sin espacios
      case 'completado':
        return 'success'; // Verde
      case 'en progreso':
        return 'warning'; // Naranjo
      case 'pendiente':
        return 'medium'; // Gris
      default:
        return 'primary'; // Azul
    }
  }
}