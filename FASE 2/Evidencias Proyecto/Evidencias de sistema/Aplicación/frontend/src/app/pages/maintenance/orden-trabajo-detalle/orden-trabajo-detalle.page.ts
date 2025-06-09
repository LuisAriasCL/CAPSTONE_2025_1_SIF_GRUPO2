import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, LoadingController, AlertController, ToastController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { ApiService, OrdenTrabajoDetalle, DetalleOtData, UsuarioResumen } from 'src/app/services/api.service';

@Component({
  selector: 'app-orden-trabajo-detalle',
  templateUrl: './orden-trabajo-detalle.page.html',
  styleUrls: ['./orden-trabajo-detalle.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, DatePipe, TitleCasePipe]
})
export class OrdenTrabajoDetallePage implements OnInit {

  ordenTrabajo: OrdenTrabajoDetalle | null = null;
  isLoading: boolean = false;
  tecnicos: UsuarioResumen[] = [];

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private navCtrl: NavController,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {
    this.cargarDetalleOt();
    this.cargarTecnicos();
  }

  async cargarDetalleOt() {
    const idOt = this.route.snapshot.paramMap.get('id');
    if (!idOt) { this.navCtrl.back(); return; }
    this.isLoading = true;
    this.apiService.getOrdenTrabajoById(+idOt).subscribe({
      next: (data) => { this.ordenTrabajo = data; this.isLoading = false; },
      error: (error) => { this.isLoading = false; this.navCtrl.back(); }
    });
  }

  cargarTecnicos() {
    this.apiService.getUsuariosPorRol('tecnico').subscribe({
      next: (data) => this.tecnicos = data,
      error: (err) => this.mostrarToast('No se pudieron cargar los técnicos.', 'danger')
    });
  }

  // La asignación ahora es SÓLO visual y temporal. No llama a la API.
  async abrirSelectorTecnicos(tarea: DetalleOtData) {
    if (this.tecnicos.length === 0) {
      this.mostrarToast('No hay técnicos disponibles para asignar.', 'warning');
      return;
    }
    const alert = await this.alertCtrl.create({
      header: 'Asignar Técnico',
      inputs: this.tecnicos.map(t => ({
        name: `tecnico-${t.id_usu}`,
        type: 'radio',
        label: `${t.pri_nom_usu} ${t.pri_ape_usu}`,
        value: t, // El valor es el objeto técnico completo
        checked: tarea.tecnico?.id_usu === t.id_usu
      })),
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Asignar',
          handler: (tecnicoSeleccionado) => {
            if (tecnicoSeleccionado) {
              // Actualizamos el técnico en el objeto local, nada más.
              tarea.tecnico = tecnicoSeleccionado;
            }
          }
        }
      ]
    });
    await alert.present();
  }

  // Se elimina la función `asignarTecnico` porque `guardarCambios` ahora hace todo.

  // `guardarCambios` es ahora el único responsable de guardar en el backend.
  async guardarCambios() {
    if (!this.ordenTrabajo || !this.ordenTrabajo.detalles) { return; }

    const loading = await this.loadingCtrl.create({ message: 'Guardando todos los cambios...' });
    await loading.present();

    // Preparamos el array con TODA la información: checklist Y el ID del técnico.
    const detallesParaActualizar = this.ordenTrabajo.detalles.map(t => ({
      id_det: t.id_det,
      checklist: t.checklist,
      // Usamos la propiedad `id_usu` del objeto `tecnico` que asignamos visualmente.
      usuarioIdUsuTecnico: t.tecnico ? t.tecnico.id_usu : null
    }));

    this.apiService.actualizarDetallesOt(detallesParaActualizar).subscribe({
      next: async (res) => {
        await loading.dismiss();
        this.mostrarToast('Cambios guardados con éxito.', 'success');
        this.navCtrl.back(); // Volvemos a la lista anterior
      },
      error: async (err) => {
        await loading.dismiss();
        console.error('Error al guardar cambios', err);
        this.mostrarToast('No se pudieron guardar los cambios.', 'danger');
      }
    });
  }

  getColorForStatus(estado: string | undefined): string {
    if (!estado) return 'medium';
    switch (estado) {
      case 'completado': return 'success';
      case 'en_progreso': return 'warning';
      case 'solicitado': return 'primary';
      case 'cancelado': return 'danger';
      default: return 'medium';
    }
  }

  async mostrarToast(mensaje: string, color: string = 'dark', duracion: number = 2000) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: duracion,
      color: color,
      position: 'bottom'
    });
    toast.present();
  }
}