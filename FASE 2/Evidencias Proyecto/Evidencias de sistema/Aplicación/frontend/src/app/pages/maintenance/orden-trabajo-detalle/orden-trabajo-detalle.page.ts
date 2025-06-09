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
    // No cargamos datos aquí para evitar dobles llamadas.
  }

  // Usamos ionViewWillEnter para asegurarnos de que los datos se recarguen
  // cada vez que el usuario entre a la página.
  ionViewWillEnter() {
    this.cargarDatosDePagina();
  }

  async cargarDatosDePagina() {
    const idOt = this.route.snapshot.paramMap.get('id');
    if (!idOt) {
      this.navCtrl.back();
      return;
    }

    this.isLoading = true;
    
    // Llamamos al API para obtener los datos frescos de la OT
    this.apiService.getOrdenTrabajoById(+idOt).subscribe({
      next: (data) => {
        // --- PUNTO DE DIAGNÓSTICO CLAVE ---
        // Esto nos mostrará en la consola del navegador el objeto completo que llega del backend.
        // Si aquí 'solicitante' es null, el problema está 100% en el backend.
        console.log('Datos recibidos del backend para la OT:', data);
        
        this.ordenTrabajo = data;
        this.isLoading = false;
        
        // Cargamos los técnicos solo después de tener los detalles de la OT
        this.cargarTecnicos();
      },
      error: (error) => {
        this.isLoading = false;
        this.mostrarToast('Error al cargar la Orden de Trabajo.', 'danger');
        this.navCtrl.back();
      }
    });
  }

  cargarTecnicos() {
    this.apiService.getUsuariosPorRol('tecnico').subscribe({
      next: (data) => this.tecnicos = data,
      error: (err) => this.mostrarToast('No se pudieron cargar los técnicos.', 'danger')
    });
  }

  async abrirSelectorTecnicos(tarea: DetalleOtData) {
    if (this.tecnicos.length === 0) {
      this.mostrarToast('No hay técnicos disponibles para asignar.', 'warning');
      return;
    }
    const alert = await this.alertCtrl.create({
      header: 'Asignar Técnico',
      inputs: this.tecnicos.map(t => ({
        name: `tecnico-radio`,
        type: 'radio',
        label: `${t.pri_nom_usu} ${t.pri_ape_usu}`,
        value: t,
        checked: tarea.tecnico?.id_usu === t.id_usu
      })),
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Asignar',
          handler: (tecnicoSeleccionado) => {
            if (tecnicoSeleccionado) {
              tarea.tecnico = tecnicoSeleccionado;
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async guardarCambios() {
    if (!this.ordenTrabajo || !this.ordenTrabajo.detalles) { return; }

    const loading = await this.loadingCtrl.create({ message: 'Guardando...' });
    await loading.present();

    const detallesParaActualizar = this.ordenTrabajo.detalles.map(t => ({
      id_det: t.id_det,
      checklist: t.checklist,
      usuarioIdUsuTecnico: t.tecnico ? t.tecnico.id_usu : null
    }));

    this.apiService.actualizarDetallesOt(detallesParaActualizar).subscribe({
      next: async () => {
        await loading.dismiss();
        this.mostrarToast('Cambios guardados con éxito.', 'success');
        this.navCtrl.back();
      },
      error: async (err) => {
        await loading.dismiss();
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