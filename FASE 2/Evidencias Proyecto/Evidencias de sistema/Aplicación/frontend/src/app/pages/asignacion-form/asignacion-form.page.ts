// src/app/pages/asignacion-form/asignacion-form.page.ts
import { Component, OnInit, inject, Input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import {
  IonicModule,
  LoadingController,
  ToastController,
  ModalController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  saveOutline,
  closeCircleOutline,
  calendarOutline,
  speedometerOutline,
  listOutline,
  peopleOutline,
  carSportOutline,
  closeOutline,
} from 'ionicons/icons';
import { AlertaPersonalizadaComponent } from 'src/app/componentes/alerta-personalizada/alerta-personalizada.component';

import {
  ApiService,
  AsignacionRecorrido,
  AsignacionRecorridoData,
  Route as RutaPlantilla,
  VehiculoAsignacionInfo,
  UsuarioConductorInfo,
} from '../../services/api.service';
import { RouteSimulationModalComponent } from '../../componentes/modals/route-simulation-modal.component';
import { FormUtils } from '../../utils/form-utils';

@Component({
  selector: 'app-asignacion-form',
  templateUrl: './asignacion-form.page.html',
  styleUrls: ['./asignacion-form.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    DatePipe,
    RouteSimulationModalComponent,
    AlertaPersonalizadaComponent,
  ],
})
export class AsignacionFormPage implements OnInit {
  // Inputs para cuando se usa como modal
  @Input() asignacionId: number | null = null;
  @Input() isEditMode: boolean = false;
  @Input() isViewMode: boolean = false;

  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private modalCtrl = inject(ModalController);

  asignacionForm!: FormGroup;
  pageTitle = 'Nueva Asignación de Recorrido';
  isLoading = false;
  isSubmitted = false;

  conductores: UsuarioConductorInfo[] = [];
  rutasPlantilla: RutaPlantilla[] = [];
  vehiculos: VehiculoAsignacionInfo[] = [];

  estadosAsignacion = [
    'pendiente',
    'asignado',
    'en_progreso',
    'completado',
    'cancelado',
  ];

  constructor() {
    addIcons({
      saveOutline,
      closeCircleOutline,
      calendarOutline,
      speedometerOutline,
      listOutline,
      peopleOutline,
      carSportOutline,
      closeOutline,
    });
  }

  ngOnInit() {
    this.updatePageTitle();
    this.initForm();
    this.loadInitialData();

    // Si hay ID, cargar datos de la asignación
    if (this.asignacionId) {
      this.loadAsignacionData();
    }
  }

  updatePageTitle() {
    if (this.isViewMode) {
      this.pageTitle = 'Ver Asignación de Recorrido';
    } else if (this.isEditMode) {
      this.pageTitle = 'Editar Asignación de Recorrido';
    } else {
      this.pageTitle = 'Nueva Asignación de Recorrido';
    }
  }

  initForm() {
    this.asignacionForm = this.fb.group({
      usuarioIdUsu: [null, Validators.required],
      rutaIdRuta: [null, Validators.required],
      vehiculoIdVehi: [null, Validators.required],
      fecIniRecor: [new Date().toISOString(), Validators.required],
      fecFinRecor: [null],
      kmIniRecor: [null, [Validators.required, Validators.min(0)]],
      kmFinRecor: [null, [Validators.min(0)]],
      estadoAsig: ['asignado', Validators.required],
      notas: [''],
      efiCombRecor: [null],
    });

    // Si está en modo visualización, deshabilitar el formulario
    if (this.isViewMode) {
      this.asignacionForm.disable();
    }
  }

  async loadInitialData() {
    this.isLoading = true;
    const loading = await this.loadingCtrl.create({
      message: 'Cargando datos necesarios...',
    });
    await loading.present();

    try {
      // Cargar conductores (usuarios con rol 'conductor')
      this.apiService
        .getUsuarios({ rol: 'conductor' })
        .subscribe((data) => (this.conductores = data));

      // Cargar rutas plantilla
      this.apiService
        .getRoutes()
        .subscribe((data) => (this.rutasPlantilla = data));

      // Cargar vehículos (idealmente solo los 'activos')
      this.apiService.getVehiculosDisponibles().subscribe({
        next: (data) => {
          
          this.vehiculos = data.map((v) => ({
            idVehi: v.idVehi || 0,
            patente: v.patente,
            modelo: v.modelo,
            marca: v.marca,
          }));
          this.isLoading = false;
          loading.dismiss();
        },
        error: async (error) => {
          this.isLoading = false;
          loading.dismiss();
          await this.showErrorAlert(
            'Error al cargar vehículos',
            error.message || 'No se pudieron cargar los vehículos'
          );
        },
      });
    } catch (error: any) {
      this.isLoading = false;
      loading.dismiss();
      await this.showErrorAlert(
        'Error al cargar datos',
        error.message || 'Ocurrió un error al cargar los datos iniciales'
      );
    }
  }

  async loadAsignacionData() {
    if (!this.asignacionId) return;

    this.isLoading = true;
    const loading = await this.loadingCtrl.create({
      message: 'Cargando asignación...',
    });
    await loading.present();

    this.apiService.getAsignacionRecorrido(this.asignacionId).subscribe({
      next: (asignacion) => {
        // Formatear fechas para los ion-datetime
        const fecIni = asignacion.fecIniRecor
          ? new Date(asignacion.fecIniRecor).toISOString()
          : null;
        const fecFin = asignacion.fecFinRecor
          ? new Date(asignacion.fecFinRecor).toISOString()
          : null;

        this.asignacionForm.patchValue({
          usuarioIdUsu: asignacion.usuarioIdUsu,
          rutaIdRuta: asignacion.rutaIdRuta,
          vehiculoIdVehi: asignacion.vehiculoIdVehi,
          fecIniRecor: fecIni,
          fecFinRecor: fecFin,
          kmIniRecor: asignacion.kmIniRecor,
          kmFinRecor: asignacion.kmFinRecor,
          estadoAsig: asignacion.estadoAsig,
          notas: asignacion.notas,
          efiCombRecor: asignacion.efiCombRecor,
        });
        this.isLoading = false;
        loading.dismiss();
      },
      error: async (error) => {
        this.isLoading = false;
        loading.dismiss();
        await this.showErrorAlert(
          'Error al cargar la asignación',
          error.message || 'No se pudo cargar la información de la asignación'
        );
        this.closeModal();
      },
    });
  }

  // Manejar cambio de vehículo para autocompletar kmIniRecor
  onVehiculoChange(event: any) {
    const vehiculoId = event.detail.value;
    if (vehiculoId && !this.isEditMode && this.asignacionForm) {
      this.apiService.getVehicle(vehiculoId).subscribe({
        next: (veh) => {
          if (veh && typeof veh.kmVehi === 'number') {
            this.asignacionForm.patchValue({ kmIniRecor: veh.kmVehi });
          }
        },
        error: async (error) => {
          await this.showErrorAlert(
            'Error al cargar el vehículo',
            error.message ||
              'No se pudo obtener la información del kilometraje del vehículo'
          );
        },
      });
    }
  }
  async submitForm() {
    const validation = FormUtils.validateForm(this.asignacionForm);
    
    if (!validation.isValid) {
      this.isSubmitted = true;
      this.presentToast(validation.firstError!, 'warning');
      return;
    }

    this.isSubmitted = true;
    this.markAllAsTouched();

    if (this.asignacionForm.invalid) {
      this.presentToast(
        'Por favor, completa todos los campos requeridos correctamente.',
        'warning'
      );
      return;
    }

    // Confirmación antes de crear/editar
    const confirm = await this.modalCtrl.create({
      component: AlertaPersonalizadaComponent,
      componentProps: {
        title: this.isEditMode ? 'Confirmar Edición' : 'Confirmar Creación',
        message: this.isEditMode
          ? '¿Estás seguro de editar esta asignación de recorrido?'
          : '¿Estás seguro de crear esta asignación de recorrido?',
        icon: this.isEditMode ? 'warning' : 'info',
        buttons: [
          { text: 'Cancelar', role: 'cancel', cssClass: 'button-cancel' },
          {
            text: this.isEditMode ? 'Actualizar' : 'Crear',
            role: 'confirm',
            cssClass: 'confirm-button',
          },
        ],
      },
      backdropDismiss: false,
      cssClass: 'custom-alert-modal',
    });

    await confirm.present();
    const { data } = await confirm.onDidDismiss();    if (data !== 'confirm') {
      this.isSubmitted = false;
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: this.isEditMode
        ? 'Actualizando asignación...'
        : 'Creando asignación...',
    });
    await loading.present();

    try {
      const formData = this.asignacionForm.value;

      // Validaciones
      const kmIniRecorNum =
        formData.kmIniRecor !== null &&
        String(formData.kmIniRecor).trim() !== ''
          ? Number(formData.kmIniRecor)
          : null;

      if (kmIniRecorNum === null || isNaN(kmIniRecorNum)) {
        await loading.dismiss();
        this.isSubmitted = false;
        this.presentToast(
          'El kilometraje inicial es inválido o no ha sido ingresado.',
          'warning'
        );
        return;
      }

      const kmFinRecorNum =
        formData.kmFinRecor !== null &&
        String(formData.kmFinRecor).trim() !== ''
          ? Number(formData.kmFinRecor)
          : null;

      if (kmFinRecorNum !== null) {
        if (isNaN(kmFinRecorNum)) {
          await loading.dismiss();
          this.isSubmitted = false;
          this.presentToast(
            'El kilometraje final ingresado no es un número válido.',
            'warning'
          );
          return;
        }
        if (kmFinRecorNum <= kmIniRecorNum) {
          await loading.dismiss();
          this.isSubmitted = false;
          this.presentToast(
            'El kilometraje final debe ser mayor que el kilometraje inicial.',
            'warning'
          );
          return;
        }
      } else if (formData.estadoAsig === 'completado') {
        await loading.dismiss();
        this.isSubmitted = false;
        this.presentToast(
          'Para marcar como "Completado", el kilometraje final es requerido y debe ser válido.',
          'warning'
        );
        return;
      }

      const asignacionData: AsignacionRecorridoData = {
        usuarioIdUsu: parseInt(formData.usuarioIdUsu, 10),
        rutaIdRuta: parseInt(formData.rutaIdRuta, 10),
        vehiculoIdVehi: parseInt(formData.vehiculoIdVehi, 10),
        fecIniRecor: new Date(formData.fecIniRecor).toISOString(),
        fecFinRecor: formData.fecFinRecor
          ? new Date(formData.fecFinRecor).toISOString()
          : null,
        kmIniRecor: kmIniRecorNum,
        kmFinRecor: kmFinRecorNum,
        estadoAsig: formData.estadoAsig,
        notas: formData.notas,
        efiCombRecor:
          formData.efiCombRecor !== null &&
          String(formData.efiCombRecor).trim() !== ''
            ? Number(formData.efiCombRecor)
            : null,
      };

      if (
        asignacionData.fecFinRecor &&
        asignacionData.fecIniRecor &&
        new Date(asignacionData.fecFinRecor) <=
          new Date(asignacionData.fecIniRecor)
      ) {
        await loading.dismiss();
        this.isSubmitted = false;
        this.presentToast(
          'La fecha de fin debe ser posterior a la fecha de inicio.',
          'warning'
        );
        return;
      }

      // Ejecutar operación de crear o editar
      if (this.isEditMode && this.asignacionId) {
        await this.apiService
          .updateAsignacionRecorrido(this.asignacionId, asignacionData)
          .toPromise();
      } else {
        await this.apiService
          .createAsignacionRecorrido(asignacionData)
          .toPromise();
      }

      await loading.dismiss();

      // Mostrar mensaje de éxito
      const successModal = await this.modalCtrl.create({
        component: AlertaPersonalizadaComponent,
        componentProps: {
          title: '¡Éxito!',
          message: `Asignación de recorrido ${
            this.isEditMode ? 'actualizada' : 'creada'
          } correctamente.`,
          icon: 'success',
          buttons: [
            { text: 'Aceptar', role: 'confirm', cssClass: 'confirm-button' },
          ],
        },
        cssClass: 'custom-alert-modal',
      });

      await successModal.present();
      await successModal.onDidDismiss();

      // Cerrar el modal y devolver true para indicar que se realizaron cambios
      this.closeModal(true);
    } catch (error: any) {
      await loading.dismiss();
      this.isSubmitted = false;

      await this.showErrorAlert(
        'Error al guardar',
        error.message || 'No se pudo guardar la asignación de recorrido'
      );
    }
  }
  // ===== MÉTODOS ESTÁNDAR DE UI =====

  /**
   * Muestra un toast con mensaje
   * @param message Mensaje a mostrar
   * @param color Color del toast (success, warning, danger, medium)
   * @param duration Duración en milisegundos
   */
  async presentToast(
    message: string,
    color: 'success' | 'warning' | 'danger' | 'primary' | 'medium' = 'medium',
    duration: number = 2500
  ) {
    const toast = await this.toastCtrl.create({
      message,
      duration,
      color,
      position: 'bottom',
    });
    await toast.present();
  }

  /**
   * Muestra una alerta de error estandarizada
   * @param title Título de la alerta
   * @param message Mensaje de error
   */
  async showErrorAlert(title: string, message: string) {
    const alert = await this.modalCtrl.create({
      component: AlertaPersonalizadaComponent,
      componentProps: {
        title: title,
        message: message,
        icon: 'error',
        buttons: [{ text: 'Aceptar', role: 'confirm' }],
      },
      cssClass: 'custom-alert-modal',
    });
    await alert.present();
    return alert.onDidDismiss();
  }

  async closeModal(dataChanged: boolean = false) {
    await this.modalCtrl.dismiss({
      dataChanged: dataChanged,
    });  }

  // Helper para acceder a los controles del formulario en la plantilla
  get f() {
    return this.asignacionForm.controls;
  }

  // Métodos de validación usando FormUtils
  markAllAsTouched(): void {
    FormUtils.markAllFieldsAsTouched(this.asignacionForm);
  }

  getFirstError(): string | null {
    return FormUtils.getFirstFormError(this.asignacionForm);
  }

  hasFieldError(fieldName: string): boolean {
    return FormUtils.hasFieldError(this.asignacionForm, fieldName, this.isSubmitted);
  }

  getFieldErrorMessage(fieldName: string, errors: any): string {
    return FormUtils.getFieldErrorMessage(fieldName, errors);
  }
}
