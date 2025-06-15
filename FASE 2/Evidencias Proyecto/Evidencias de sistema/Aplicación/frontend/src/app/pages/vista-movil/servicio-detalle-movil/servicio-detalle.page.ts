import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { ApiService, OrdenTrabajoDetalle } from 'src/app/services/api.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-servicio-detalle',
  templateUrl: './servicio-detalle.page.html',
  styleUrls: ['./servicio-detalle.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})

export class ServicioDetallePage implements OnInit {
  ot: OrdenTrabajoDetalle | null = null;
  isLoading = true;
  otId: number = 0;
  currentUserId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private toastController: ToastController,
    private navCtrl: NavController,
    private authService: AuthService 
  ) { }

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    this.currentUserId = currentUser ? currentUser.idUsu : null;

    this.otId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarDetalleOT();
  }

  cargarDetalleOT() {
    this.isLoading = true;
    this.apiService.getOrdenTrabajoById(this.otId).subscribe({
      next: (data) => {
        this.ot = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.presentToast('Error al cargar el detalle de la OT.');
      }
    });
  }

  guardarProgreso() {
    if (!this.ot) return;

    const payload = {
      detalles: this.ot.detalles.map(d => ({
        id_det: d.id_det,
        checklist: d.checklist
      }))
    };
    
    this.apiService.actualizarDetallesOt(this.otId, payload).subscribe({
      next: async () => {
        await this.presentToast('Progreso guardado con éxito.');
        this.navCtrl.back();
      },
      error: async (err) => {
        await this.presentToast('Error al guardar el progreso.');
        console.error(err);
      }
    });
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({ message, duration: 3000, position: 'bottom' });
    toast.present();
  }
}
