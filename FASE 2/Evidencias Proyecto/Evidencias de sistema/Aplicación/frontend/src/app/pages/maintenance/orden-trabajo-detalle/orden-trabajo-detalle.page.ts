// frontend/src/app/pages/maintenance/orden-trabajo-detalle/orden-trabajo-detalle.page.ts

import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, LoadingController, ToastController, ModalController } from '@ionic/angular';
import { ApiService, OrdenTrabajoDetalle, DetalleOtData, UsuarioResumen } from 'src/app/services/api.service';
import { AuthService } from 'src/app/services/auth.service';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline, closeCircleOutline, helpCircleOutline, saveOutline, flagOutline, personAddOutline, 
         personCircleOutline, carSportOutline, speedometerOutline, documentTextOutline, close } from 'ionicons/icons';
import { AlertaPersonalizadaComponent } from '../../../componentes/alerta-personalizada/alerta-personalizada.component';

@Component({
  selector: 'app-orden-trabajo-detalle',
  templateUrl: './orden-trabajo-detalle.page.html',
  styleUrls: ['./orden-trabajo-detalle.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, AlertaPersonalizadaComponent]
})
export class OrdenTrabajoDetallePage implements OnInit {
  @Input() ordenTrabajoId: number | null = null;
  @Input() isViewMode: boolean = false;

  
  ordenTrabajo: OrdenTrabajoDetalle | null = null;
  isLoading: boolean = false;
  tecnicos: UsuarioResumen[] = [];
  pageTitle: string = 'Detalle de Orden de Trabajo';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController
  ) {
    addIcons({ 
      checkmarkCircleOutline, closeCircleOutline, helpCircleOutline, 
      saveOutline, flagOutline, personAddOutline, personCircleOutline,
      carSportOutline, speedometerOutline, documentTextOutline, close
    });
  }

  ngOnInit() {
    if (this.ordenTrabajoId) {
      this.cargarDatosDePagina();
    }
  }

  async cargarDatosDePagina() {
    if (!this.ordenTrabajoId) {
      this.closeModal();
      return;
    }
    
    this.isLoading = true;
    
    const loading = await this.loadingCtrl.create({
      message: 'Cargando datos...'
    });
    await loading.present();
    
    this.apiService.getOrdenTrabajoById(this.ordenTrabajoId).subscribe({
      next: (data) => {
        this.ordenTrabajo = data;
        this.isLoading = false;
        loading.dismiss();
        this.cargarTecnicos();
      },
      error: async (error) => {
        this.isLoading = false;
        loading.dismiss();
        
        const modal = await this.modalCtrl.create({
          component: AlertaPersonalizadaComponent,
          componentProps: {
            title: 'Error',
            message: 'No se pudo cargar la información de la orden de trabajo.',
            icon: 'error',
            buttons: [{ text: 'Aceptar', role: 'confirm' }]
          },
          cssClass: 'custom-alert-modal'
        });
        await modal.present();
        this.closeModal();
      }
    });
  }

  cargarTecnicos() {
    this.apiService.getUsuariosPorRol('tecnico').subscribe({
      next: (data) => this.tecnicos = data,
      error: async (err) => {
        const modal = await this.modalCtrl.create({
          component: AlertaPersonalizadaComponent,
          componentProps: {
            title: 'Advertencia',
            message: 'No se pudieron cargar los técnicos disponibles.',
            icon: 'warning',
            buttons: [{ text: 'Entendido', role: 'confirm' }]
          },
          cssClass: 'custom-alert-modal'
        });
        await modal.present();
      }
    });
  }

  async abrirSelectorTecnicos(tarea: DetalleOtData) {
    if (this.tecnicos.length === 0) {
      const modal = await this.modalCtrl.create({
        component: AlertaPersonalizadaComponent,
        componentProps: {
          title: 'Sin Técnicos',
          message: 'No hay técnicos disponibles para asignar.',
          icon: 'info',
          buttons: [{ text: 'Aceptar', role: 'confirm' }]
        },
        cssClass: 'custom-alert-modal'
      });
      await modal.present();
      return;
    }

    const alert = await this.modalCtrl.create({
      component: AlertaPersonalizadaComponent,
      componentProps: {
        title: 'Asignar Técnico',
        message: 'Seleccione el técnico para esta tarea:',
        icon: 'help',
        buttons: [
          { text: 'Cancelar', role: 'cancel', cssClass: 'button-cancel' },
          ...this.tecnicos.map(t => ({
            text: `${t.pri_nom_usu} ${t.pri_ape_usu}`,
            role: t.id_usu.toString(),
            cssClass: tarea.tecnico?.id_usu === t.id_usu ? 'confirm-button' : ''
          }))
        ]
      },
      cssClass: 'custom-alert-modal'
    });
    
    await alert.present();
    const { data } = await alert.onDidDismiss();
    
    if (data && !isNaN(parseInt(data))) {
      const tecnicoId = parseInt(data);
      const tecnicoSeleccionado = this.tecnicos.find(t => t.id_usu === tecnicoId);
      if (tecnicoSeleccionado) {
        tarea.tecnico = tecnicoSeleccionado;
      }
    }
  }

  async iniciarOrdenDeTrabajo() {
    if (!this.ordenTrabajo) return;
  
    const currentUser = this.authService.getCurrentUser();
  
    if (!currentUser) {
      this.presentToast('No se pudo identificar al usuario actual.', 'danger');
      return;
    }
  
    const confirmModal = await this.modalCtrl.create({
      component: AlertaPersonalizadaComponent,
      componentProps: {
        title: 'Iniciar Orden de Trabajo',
        message: `¿Confirmas iniciar la OT #${this.ordenTrabajo.id_ot}? Serás asignado como encargado.`,
        icon: 'help',
        buttons: [
          { text: 'Cancelar', role: 'cancel', cssClass: 'button-cancel' },
          { text: 'Sí, Iniciar', role: 'confirm', cssClass: 'confirm-button' }
        ]
      },
      backdropDismiss: false,
      cssClass: 'custom-alert-modal'
    });
    
    await confirmModal.present();
    const { data } = await confirmModal.onDidDismiss();
    
    if (data === 'confirm') {
      const loading = await this.loadingCtrl.create({
        message: 'Iniciando orden de trabajo...'
      });
      await loading.present();
      
      this.apiService.actualizarEstadoOt(this.ordenTrabajo.id_ot, 'en_progreso', currentUser.idUsu).subscribe({
        next: async () => {
          await loading.dismiss();
          this.presentToast('Orden de Trabajo iniciada.', 'success');
          this.cargarDatosDePagina();
        },
        error: async (err) => {
          await loading.dismiss();
          const errorModal = await this.modalCtrl.create({
            component: AlertaPersonalizadaComponent,
            componentProps: {
              title: 'Error',
              message: 'No se pudo iniciar la orden de trabajo.',
              icon: 'error',
              buttons: [{ text: 'Aceptar', role: 'confirm' }]
            },
            cssClass: 'custom-alert-modal'
          });
          await errorModal.present();
        }
      });
    }
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
    
    
    const datosParaActualizar = {
        km_ot: this.ordenTrabajo.km_ot,
        descripcion_ot: this.ordenTrabajo.descripcion_ot,
        detalles: detallesParaActualizar
    };
    
    this.apiService.actualizarDetallesOt(this.ordenTrabajo.id_ot, datosParaActualizar).subscribe({
      next: async () => {
        await loading.dismiss();
        this.presentToast('Progreso guardado con éxito.', 'success');
      },
      error: async (err) => {
        await loading.dismiss();
        const errorModal = await this.modalCtrl.create({
          component: AlertaPersonalizadaComponent,
          componentProps: {
            title: 'Error',
            message: 'No se pudieron guardar los cambios.',
            icon: 'error',
            buttons: [{ text: 'Aceptar', role: 'confirm' }]
          },
          cssClass: 'custom-alert-modal'
        });
        await errorModal.present();
      }
    });
  }

  async finalizarOrdenDeTrabajo() {
    if (!this.ordenTrabajo) return;
    
    const todasCompletas = this.ordenTrabajo.detalles.every(t => t.checklist);
    
    if (!todasCompletas) {
      const warnModal = await this.modalCtrl.create({
        component: AlertaPersonalizadaComponent,
        componentProps: {
          title: 'Advertencia',
          message: 'Debes completar todas las tareas para poder finalizar la OT.',
          icon: 'warning',
          buttons: [{ text: 'Entendido', role: 'confirm' }]
        },
        cssClass: 'custom-alert-modal'
      });
      await warnModal.present();
      return;
    }
    
    const confirmModal = await this.modalCtrl.create({
      component: AlertaPersonalizadaComponent,
      componentProps: {
        title: 'Finalizar Orden de Trabajo',
        message: '¿Estás seguro de finalizar esta OT? La acción no se puede deshacer.',
        icon: 'help',
        buttons: [
          { text: 'Cancelar', role: 'cancel', cssClass: 'button-cancel' },
          { text: 'Sí, Finalizar', role: 'confirm', cssClass: 'confirm-button' }
        ]
      },
      backdropDismiss: false,
      cssClass: 'custom-alert-modal'
    });
    
    await confirmModal.present();
    const { data } = await confirmModal.onDidDismiss();
    
    if (data === 'confirm') {
      const loading = await this.loadingCtrl.create({
        message: 'Finalizando orden de trabajo...'
      });
      await loading.present();
      
      this.apiService.actualizarEstadoOt(this.ordenTrabajo.id_ot, 'completado').subscribe({
        next: async () => {
          await loading.dismiss();
          this.presentToast('Orden de Trabajo finalizada.', 'success');
          this.closeModal(true);
        },
        error: async (err) => {
          await loading.dismiss();
          const errorModal = await this.modalCtrl.create({
            component: AlertaPersonalizadaComponent,
            componentProps: {
              title: 'Error',
              message: 'No se pudo finalizar la orden de trabajo.',
              icon: 'error',
              buttons: [{ text: 'Aceptar', role: 'confirm' }]
            },
            cssClass: 'custom-alert-modal'
          });
          await errorModal.present();
        }
      });
    }
  }

  getColorForStatus(estado: string | undefined): string {
    if (!estado) return 'medium';
    const colores: { [key: string]: string } = {
      solicitado: 'primary', en_progreso: 'warning', completado: 'success', cancelado: 'danger'
    };
    return colores[estado] || 'medium';
  }
  
  getStatusDisplayName(estado: string | undefined): string {
    if (!estado) return 'Sin estado';
    
    const estadosDisplay: { [key: string]: string } = {
      solicitado: 'Solicitado',
      en_progreso: 'En Progreso',
      completado: 'Completado',
      cancelado: 'Cancelado'
    };
    
    return estadosDisplay[estado] || estado;
  }

  isValidDate(dateStr: any): boolean {
    if (!dateStr) return false;
    
    if (typeof dateStr === 'string') {
      const date = new Date(dateStr);
      return !isNaN(date.getTime());
    }
    
    if (dateStr instanceof Date) {
      return !isNaN(dateStr.getTime());
    }
    
    return false;
  }

  async presentToast(mensaje: string, color: string = 'dark', duracion: number = 2000) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: duracion,
      color: color,
      position: 'bottom'
    });
    toast.present();
  }
  
  async closeModal(updated: boolean = false) {
    await this.modalCtrl.dismiss({
      updated: updated
    });
  }
}