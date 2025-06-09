// frontend/src/app/pages/maintenance/orden-trabajo-detalle/orden-trabajo-detalle.page.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, LoadingController, AlertController, ToastController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService, OrdenTrabajoDetalle, DetalleOtData, UsuarioResumen } from 'src/app/services/api.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-orden-trabajo-detalle',
  templateUrl: './orden-trabajo-detalle.page.html',
  styleUrls: ['./orden-trabajo-detalle.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class OrdenTrabajoDetallePage implements OnInit {

  ordenTrabajo: OrdenTrabajoDetalle | null = null;
  isLoading: boolean = false;
  tecnicos: UsuarioResumen[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private navCtrl: NavController,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() { }

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
    this.apiService.getOrdenTrabajoById(+idOt).subscribe({
      next: (data) => {
        this.ordenTrabajo = data;
        this.isLoading = false;
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

  // ===== LÓGICA COMPLETA Y FUNCIONAL PARA SELECCIONAR TÉCNICOS =====
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

  // ===== LÓGICA COMPLETA Y FUNCIONAL PARA EL CICLO DE VIDA DE LA OT =====
  async iniciarOrdenDeTrabajo() {
  if (!this.ordenTrabajo) return;

  // --- ASEGÚRATE DE QUE ESTA LÍNEA USE TU FUNCIÓN ---
  const currentUser = this.authService.getCurrentUser();
  // --- FIN DE LA LÍNEA CRÍTICA ---

  if (!currentUser) {
    this.mostrarToast('No se pudo identificar al usuario actual.', 'danger');
    return;
  }

  const alert = await this.alertCtrl.create({
    header: 'Iniciar Orden de Trabajo',
    message: `¿Confirmas iniciar la OT #${this.ordenTrabajo.id_ot}? Serás asignado como encargado.`,
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Sí, Iniciar',
        handler: () => {
          // Aquí usamos la propiedad correcta 'idUsu' de tu interfaz UserInfo
          this.apiService.actualizarEstadoOt(this.ordenTrabajo!.id_ot, 'en_progreso', currentUser.idUsu).subscribe({
            next: () => {
              this.mostrarToast('Orden de Trabajo iniciada.', 'success');
              this.cargarDatosDePagina();
            },
            error: (err) => this.mostrarToast('Error al iniciar la OT.', 'danger')
          });
        }
      }
    ]
  });
  await alert.present();
}
  
  async guardarProgresoTareas() {
    if (!this.ordenTrabajo || !this.ordenTrabajo.detalles) { return; }
    const loading = await this.loadingCtrl.create({ message: 'Guardando progreso...' });
    await loading.present();
    const detallesParaActualizar = this.ordenTrabajo.detalles.map(t => ({
      id_det: t.id_det,
      checklist: t.checklist,
      usuario_id_usu_tecnico: t.tecnico ? t.tecnico.id_usu : null
    }));
    this.apiService.actualizarDetallesOt(this.ordenTrabajo.id_ot, detallesParaActualizar).subscribe({
      next: async () => {
        await loading.dismiss();
        this.mostrarToast('Progreso guardado con éxito.', 'success');
      },
      error: async (err) => {
        await loading.dismiss();
        this.mostrarToast('No se pudieron guardar los cambios.', 'danger');
      }
    });
  }

  async finalizarOrdenDeTrabajo() {
    if (!this.ordenTrabajo) return;
    const todasCompletas = this.ordenTrabajo.detalles.every(t => t.checklist);
    if (!todasCompletas) {
      this.mostrarToast('Debes completar todas las tareas para poder finalizar la OT.', 'warning');
      return;
    }
    const alert = await this.alertCtrl.create({
      header: 'Finalizar Orden de Trabajo',
      message: '¿Estás seguro de finalizar esta OT? La acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Sí, Finalizar',
          handler: () => {
            this.apiService.actualizarEstadoOt(this.ordenTrabajo!.id_ot, 'completado').subscribe({
              next: () => {
                this.mostrarToast('Orden de Trabajo finalizada.', 'success');
                this.router.navigate(['/orden-trabajo-list']);
              },
              error: (err) => this.mostrarToast('Error al finalizar la OT.', 'danger')
            });
          }
        }
      ]
    });
    await alert.present();
  }

  getColorForStatus(estado: string | undefined): string {
    if (!estado) return 'medium';
    const colores: { [key: string]: string } = {
      solicitado: 'primary', en_progreso: 'warning', completado: 'success', cancelado: 'danger'
    };
    return colores[estado] || 'medium';
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