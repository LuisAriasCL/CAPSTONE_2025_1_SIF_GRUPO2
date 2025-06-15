import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ViewWillEnter } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-historial-combustible',
  templateUrl: './historial-combustible.page.html',
  styleUrls: ['./historial-combustible.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class HistorialCombustiblePage implements ViewWillEnter {

  historial: any[] = [];
  isLoading = true;

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) { }

  ionViewWillEnter() {
    this.cargarHistorial();
  }

  cargarHistorial() {
    this.isLoading = true;
    const usuario = this.authService.getCurrentUser();
    if (usuario) {
      this.apiService.getHistorialCombustible(usuario.idUsu).subscribe({
        next: (data) => {
          this.historial = data;
          this.isLoading = false;
        },
        error: (err) => {
          console.error("Error al cargar historial", err);
          this.isLoading = false;
        }
      });
    }
  }
}