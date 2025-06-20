import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core'; // <-- 1. IMPORTAR ChangeDetectorRef
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { IonicModule, ToastController, AlertController, NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { ApiService, Siniestro } from '../../services/api.service';
import { HeaderComponent } from 'src/app/componentes/header/header.component';

@Component({
  selector: 'app-siniestro-detalle',
  templateUrl: './siniestro-detalle.page.html',
  styleUrls: ['./siniestro-detalle.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, HeaderComponent, DatePipe, TitleCasePipe]
})
export class SiniestroDetallePage implements OnInit {
  public siniestro: Siniestro | null = null;
  public cargando = true;
  public readonly apiUrl = 'http://localhost:8101'; 

  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private navCtrl = inject(NavController);
  private cdr = inject(ChangeDetectorRef); 

  constructor() { }

  ngOnInit() {
    this.cargarDetalleSiniestro();
  }

  cargarDetalleSiniestro() {
    this.cargando = true;
    const siniestroId = this.route.snapshot.paramMap.get('id');

    if (!siniestroId) {
      this.navCtrl.back();
      return;
    }

    this.apiService.getSiniestroById(+siniestroId).subscribe({
      next: (data) => {
        this.siniestro = data;
        this.cargando = false;
        // --- 3. LÍNEA CLAVE PARA FORZAR LA ACTUALIZACIÓN VISUAL ---
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        this.cargando = false;
        this.mostrarToast('No se pudo cargar la información del incidente.', 'danger');
        this.navCtrl.back();
      }
    });
  }

  async actualizarEstado() {
    if (!this.siniestro) return;

    const estadosPosibles = ['en_revision', 'resuelto', 'cancelado'];

    const alert = await this.alertCtrl.create({
      header: 'Actualizar Estado',
      message: 'Selecciona el nuevo estado para este incidente.',
      inputs: estadosPosibles.map(estado => ({
        type: 'radio',
        label: estado.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: estado,
        checked: this.siniestro?.estado === estado
      })),
      buttons: [
        { text: 'Cancelar' },
        {
          text: 'Actualizar',
          handler: (nuevoEstado) => {
            if (nuevoEstado && this.siniestro) {
              this.apiService.updateSiniestroStatus(this.siniestro.id, nuevoEstado).subscribe({
                next: () => {
                  this.mostrarToast('Estado actualizado con éxito.', 'success');
                  if (this.siniestro) {
                    this.siniestro.estado = nuevoEstado;
                    this.cdr.detectChanges(); // Forzar actualización aquí también es buena idea
                  }
                },
                error: (err) => this.mostrarToast('Error al actualizar el estado.', 'danger')
              });
            }
          }
        }
      ]
    });

    await alert.present();
  }
  
  getColorForStatus(estado: string | undefined): string {
    if(!estado) return 'light';
    switch (estado) {
      case 'reportado': return 'warning';
      case 'en_revision': return 'primary';
      case 'resuelto': return 'success';
      case 'cancelado': return 'medium';
      default: return 'light';
    }
  }

  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 3000,
      color: color
    });
    toast.present();
  }
}