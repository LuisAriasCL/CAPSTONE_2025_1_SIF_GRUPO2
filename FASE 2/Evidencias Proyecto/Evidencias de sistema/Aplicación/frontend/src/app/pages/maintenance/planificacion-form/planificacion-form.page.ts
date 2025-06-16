import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, AbstractControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; // Para *ngIf, *ngFor
import { IonicModule } from '@ionic/angular';   // Para todos los componentes Ionic
import { NavController, ToastController, LoadingController, AlertController, ModalController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  closeOutline, saveOutline, addCircleOutline, removeCircleOutline,
  closeCircleOutline 
} from 'ionicons/icons';
import { ApiService, VehiculoAsignacionInfo, PlanificacionMantenimientoData, PlanificacionMantenimientoResumen } from '../../../services/api.service'; // Ajusta la ruta
import { AlertaPersonalizadaComponent } from '../../../componentes/alerta-personalizada/alerta-personalizada.component';

@Component({
  selector: 'app-planificacion-form',
  templateUrl: './planificacion-form.page.html',
  styleUrls: ['./planificacion-form.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    FormsModule,
    AlertaPersonalizadaComponent
  ]
})
export class PlanificacionFormPage implements OnInit {
  @Input() planId?: number;
  @Input() isEditMode: boolean = false;
  @Input() isViewMode: boolean = false;
  
  planForm!: FormGroup;
  vehiculosDisponibles: VehiculoAsignacionInfo[] = [];
  isSubmitted = false;
  pageTitle = 'Crear Planificación';
  
  // Propiedades para datos cargados (estilo RouteFormPage)
  loadedTareas: any[] = [];
  loadedVehiculosIds: number[] = [];tareasDisponibles: any;
  tipoFrecuenciaSeleccionado: string | null = null;
  selectedTab = 'infoGeneral';

  // Agregar esta propiedad
  esPreventivo: boolean = true;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private navCtrl: NavController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    private route: ActivatedRoute
  ) {
    addIcons({
      closeOutline, saveOutline, addCircleOutline, removeCircleOutline,
      closeCircleOutline
    });
  }  
  
  setPreventivo(value: boolean) {
    if (this.isViewMode) return;
    this.esPreventivo = value;
    this.planForm.patchValue({ esPreventivo: value });
  }

  ngOnInit() {
    // Support for both modal parameters and route parameters
    if (!this.planId) {
      this.route.paramMap.subscribe(params => {
        const id = params.get('id');
        if (id) {
          this.planId = parseInt(id);
          this.isEditMode = true;
        }
      });
    }

    this.updatePageTitle();
    this.initForm();
    this.cargarVehiculos();
    
    // Verificar si se recibieron parámetros via modal (Input properties)
    if (this.planId && (this.isEditMode || this.isViewMode)) {
      this.loadPlanificacionData();
    } else {
      // Modo creación - agregar una tarea por defecto
      this.agregarTarea();
    }

    this.tipoFrecuenciaSeleccionado = this.planForm.get('tipoFrecuencia')?.value || null;

    // Agregar después de initForm()
    this.planForm.get('esPreventivo')?.valueChanges.subscribe(value => {
      this.esPreventivo = value;
    });
  }

  updatePageTitle() {
    if (this.isViewMode) {
      this.pageTitle = 'Ver Planificación';
    } else if (this.isEditMode) {
      this.pageTitle = 'Editar Planificación';
    } else {
      this.pageTitle = 'Crear Planificación';
    }
  }

  initForm() {
    this.planForm = this.fb.group({
      descPlan: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(255)]],
      frecuencia: [null, [Validators.required, Validators.min(1)]],
      tipoFrecuencia: ['', Validators.required],
      esPreventivo: [true, Validators.required],
      esActivoPlan: [true, Validators.required],
      vehiculosIds: [[], [Validators.required, Validators.minLength(1)]],
      tareas: this.fb.array([], [Validators.required, Validators.minLength(1)])
    });
    if (this.tareas.length === 0) {
        this.agregarTarea(); // Asegurar al menos una tarea al inicio
    }
  }

  // Getter para acceder a los controles del formulario de forma más corta.
  // La plantilla puede acceder a 'f' directamente.
  get f() { return this.planForm.controls; }

  // Getter para acceder al FormArray de tareas
  get tareas() {
    return this.planForm.get('tareas') as FormArray;
  }

  // Métodos de validación estandarizados
  markAllAsTouched() {
    Object.values(this.planForm.controls).forEach(control => {
      control.markAsTouched();
    });
    // También marcar los controles del FormArray de tareas
    this.tareas.controls.forEach(tareaControl => {
      Object.values((tareaControl as FormGroup).controls).forEach(control => {
        control.markAsTouched();
      });
    });
  }

  hasFieldError(fieldName: string): boolean {
    const control = this.planForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched || this.isSubmitted));
  }

  hasTareaFieldError(index: number, fieldName: string): boolean {
    const tareaControl = this.tareas.at(index);
    const fieldControl = tareaControl?.get(fieldName);
    return !!(fieldControl && fieldControl.invalid && (fieldControl.dirty || fieldControl.touched || this.isSubmitted));
  }

  getFieldErrorMessage(fieldName: string, errors: any): string {
    if (!errors) return '';

    const errorMessages: { [key: string]: { [key: string]: string } } = {
      descPlan: {
        required: 'Descripción de la planificación es requerida',
        maxlength: 'Descripción no puede exceder 500 caracteres'
      },
      tipoFrecuencia: {
        required: 'Tipo de frecuencia es requerido'
      },
      frecuencia: {
        required: 'Frecuencia es requerida',
        min: 'Frecuencia debe ser mayor a 0'
      },
      vehiculosIds: {
        required: 'Debe seleccionar al menos un vehículo'
      },
      nomTareaPlan: {
        required: 'Nombre de la tarea es requerido',
        maxlength: 'Nombre no puede exceder 200 caracteres'
      },
      descTareaPlan: {
        maxlength: 'Descripción no puede exceder 1000 caracteres'
      }
    };

    const fieldErrors = errorMessages[fieldName];
    if (fieldErrors) {
      for (const errorType in errors) {
        if (fieldErrors[errorType]) {
          return fieldErrors[errorType];
        }
      }
    }

    return 'Campo inválido';
  }

  getTareaFieldErrorMessage(fieldName: string, errors: any): string {
    return this.getFieldErrorMessage(fieldName, errors);
  }

  crearTareaFormGroup(): FormGroup {
    return this.fb.group({
      nomTareaPlan: ['', [Validators.required, Validators.maxLength(150)]], // Coincide con formControlName="nomTareaPlan"
      descTareaPlan: ['', Validators.maxLength(500)]  // Coincide con formControlName="descTareaPlan"
    });
  }

  agregarTarea() {
    this.tareas.push(this.crearTareaFormGroup());
  }

  eliminarTarea(index: number) {
    if (this.tareas.length > 1) {
      this.tareas.removeAt(index);
    } else {
      this.mostrarToast('Una planificación debe tener al menos una tarea.', 'warning');
    }
  }

  cargarVehiculos() {
    this.apiService.getVehiculosDisponibles().subscribe( // Asegúrate que este método exista
      (data) => {
        this.vehiculosDisponibles = data;
      },
      (error) => {
        console.error('Error cargando vehículos:', error);
        this.mostrarToast(error.message || 'Error al cargar la lista de vehículos.', 'danger');
      }
    );
  }
  async onSubmit() {
    // Confirmación en modo edición
    if (this.isEditMode) {
      const confirmModal = await this.modalCtrl.create({
        component: AlertaPersonalizadaComponent,
        componentProps: {
          title: 'Confirmar Edición',
          message: `¿Estás seguro de editar <strong>${this.pageTitle}</strong>?`,
          icon: 'warning',
          buttons: [
            { text: 'Cancelar', role: 'cancel', cssClass: 'button-cancel' },
            { text: 'Editar', role: 'confirm', cssClass: 'confirm-button' }
          ]
        },
        backdropDismiss: false,
        cssClass: 'custom-alert-modal'
      });
      await confirmModal.present();
      const { data } = await confirmModal.onDidDismiss();
      if (data !== 'confirm') return;
    }

    this.isSubmitted = true;
    this.planForm.markAllAsTouched();

    if (this.planForm.invalid) {
      const firstError = this.getFirstError();
      if (firstError) {
        // Obtener referencia a los tabs
        const tabs = document.querySelector('ion-tabs');
        
        // Primero, asegurar que estamos en el tab correcto
        await tabs?.select(firstError.tab);

        // Esperar a que cambie el tab y la vista se actualice
        setTimeout(() => {
          const errorElement = document.getElementById(firstError.id);
          if (errorElement) {
            // Asegurar que el elemento es visible después del cambio de tab
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            errorElement.classList.add('shake-animation');
            setTimeout(() => errorElement.classList.remove('shake-animation'), 1000);

            // Generar mensaje específico según el tipo de error
            let fieldName = '';
            switch (firstError.id) {
              case 'descPlan': fieldName = 'nombre del mantenimiento'; break;
              case 'tipoFrecuencia': fieldName = 'tipo de frecuencia'; break;
              case 'frecuencia': fieldName = 'frecuencia'; break;
              case 'vehiculosIds': fieldName = 'vehículos asignados'; break;
              default: fieldName = firstError.id.includes('tarea') ? 'tarea' : 'campo';
            }
            this.mostrarToast(`Por favor, complete el ${fieldName} correctamente.`, 'warning');
          }
        }, 300); // Dar más tiempo para que el cambio de tab sea efectivo
        
        return;
      }
    }

    // Confirmación antes de crear una nueva planificación
    if (!this.isEditMode) {
      const confirmModal = await this.modalCtrl.create({
        component: AlertaPersonalizadaComponent,
        componentProps: {
          title: 'Confirmar Creación',
          message: `¿Estás seguro de crear la planificación "${this.planForm.value.descPlan}"?`,
          icon: 'info',
          buttons: [
            { text: 'Cancelar', role: 'cancel', cssClass: 'button-cancel' },
            { text: 'Crear', role: 'confirm', cssClass: 'confirm-button' }
          ]
        },
        backdropDismiss: false,
        cssClass: 'custom-alert-modal'
      });
      await confirmModal.present();
      const { data } = await confirmModal.onDidDismiss();
      if (data !== 'confirm') {
        return; // Cancelar creación si no confirma
      }
    }

    const isEditMode = this.isEditMode && this.planId;
    const loading = await this.loadingCtrl.create({ 
      message: isEditMode ? 'Actualizando planificación...' : 'Guardando planificación...' 
    });
    await loading.present();

    // Construcción manual del objeto (estilo RouteFormPage)
    const planData: Partial<PlanificacionMantenimientoData> = {
      descPlan: this.planForm.value.descPlan,
      frecuencia: this.planForm.value.frecuencia,
      tipoFrecuencia: this.planForm.value.tipoFrecuencia,
      esPreventivo: this.planForm.value.esPreventivo,
      esActivoPlan: this.planForm.value.esActivoPlan,
      vehiculosIds: this.planForm.value.vehiculosIds,
      tareas: this.tareas.value
    };

    console.log('Datos de la planificación a enviar:', planData);

    const apiCall = isEditMode 
      ? this.apiService.updatePlanificacion(this.planId!, planData as PlanificacionMantenimientoData)
      : this.apiService.crearPlanificacion(planData as PlanificacionMantenimientoData);

    apiCall.subscribe({
      next: async (response) => {
        await loading.dismiss();
        const message = isEditMode 
          ? `Planificación actualizada exitosamente.`
          : `Planificación "${response.planificacion?.descPlan || planData.descPlan}" creada exitosamente.`;
        
        this.mostrarToast(message, 'success');
        
        // Close modal if we're in modal mode, otherwise navigate
        if (this.modalCtrl) {
          await this.closeModal({ 
            planificacionCreated: !isEditMode, 
            planificacionUpdated: isEditMode 
          });
        } else {
          if (!isEditMode) {
            this.planForm.reset({
              esPreventivo: true,
              esActivoPlan: true,
              vehiculosIds: [],
            });
            this.tareas.clear();
            this.agregarTarea();
            this.isSubmitted = false;
          }
          this.navCtrl.navigateRoot('/tabs/planificaciones', { animationDirection: 'back' });
        }
      },
      error: async (error) => {
        await loading.dismiss();
        console.error('Error al procesar planificación:', error);
        const errorMessage = isEditMode 
          ? 'No se pudo actualizar la planificación. Intente más tarde.'
          : 'No se pudo crear la planificación. Intente más tarde.';
        this.mostrarToast(error.message || errorMessage, 'danger', 5000);
      }
    });
  }

  getFirstError(): { id: string, tab: string } | null {
    // Verificar campos del tab de información general
    if (this.f['descPlan'].invalid) return { id: 'descPlan', tab: 'infoGeneral' };
    if (this.f['tipoFrecuencia'].invalid) return { id: 'tipoFrecuencia', tab: 'infoGeneral' };
    if (this.f['frecuencia'].invalid) return { id: 'frecuencia', tab: 'infoGeneral' };
    if (this.f['vehiculosIds'].invalid) return { id: 'vehiculosIds', tab: 'infoGeneral' };

    // Verificar tareas
    const tareas = this.tareas.controls;
    for (let i = 0; i < tareas.length; i++) {
      const tarea = tareas[i];
      if (tarea.get('nomTareaPlan')?.invalid) {
        return { id: `tarea-${i}-nombre`, tab: 'tareasPlanificacion' };
      }
      if (tarea.get('descTareaPlan')?.invalid) {
        return { id: `tarea-${i}-descripcion`, tab: 'tareasPlanificacion' };
      }
    }

    return null;
  }

  async mostrarToast(mensaje: string, color: string = 'dark', duracion: number = 3000) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: duracion,
      color: color,
      position: 'bottom',
      buttons: [{ text: 'Cerrar', role: 'cancel' }]
    });
    toast.present();
  }

  async closeModal(data?: any) {
    await this.modalCtrl.dismiss(data);
  }
  async loadPlanificacionData() {
    if (!this.planId) return;

    const loading = await this.loadingCtrl.create({ message: 'Cargando planificación...' });
    await loading.present();

    this.apiService.getPlanificacionById(this.planId).subscribe({
      next: async (data) => {
        await loading.dismiss();
        
        // Mapeo directo de datos (estilo RouteFormPage)
        this.planForm.patchValue({
          descPlan: data.descPlan,
          frecuencia: data.frecuencia,
          tipoFrecuencia: data.tipoFrecuencia,
          esActivoPlan: data.esActivoPlan,
          esPreventivo: data.esPreventivo
        });

        // Asignar datos a propiedades del componente (estilo RouteFormPage)
        this.loadedTareas = data.tareas || [];
        this.loadedVehiculosIds = data.vehiculosEnPlan?.map(v => v.idVehi) || [];

        // Cargar tareas en el FormArray
        this.cargarTareasEnFormulario();
        // Asignar vehículos al control
        this.planForm.patchValue({ vehiculosIds: this.loadedVehiculosIds });

        console.log('Planificación cargada:', data);
      },
      error: async (error) => {
        await loading.dismiss();
        console.error('Error al cargar planificación:', error);
        this.mostrarToast(error.message || 'Error al cargar la planificación', 'danger');
      }
    });
  }

  private cargarTareasEnFormulario() {
    // Limpiar FormArray
    this.tareas.clear();
    
    // Agregar tareas cargadas
    if (this.loadedTareas.length > 0) {
      this.loadedTareas.forEach(() => {
        this.agregarTarea();
      });
      
      // Llenar los valores de las tareas
      this.loadedTareas.forEach((tarea, index) => {
        const tareaControl = this.tareas.at(index);
        tareaControl.patchValue({
          nomTareaPlan: tarea.nomTareaPlan,
          descTareaPlan: tarea.descTareaPlan || ''
        });
      });
    } else {
      // Si no hay tareas, agregar una por defecto
      this.agregarTarea();
    }
  }

  onTipoFrecuenciaChange(event: any) {
    this.tipoFrecuenciaSeleccionado = event.detail?.value || null;
    if (!this.tipoFrecuenciaSeleccionado) {
      this.planForm.get('frecuencia')?.reset();
    }
  }

  // Añadir este método
  segmentChanged(event: any) {
    this.selectedTab = event.detail.value;
    const tabs = document.querySelector('ion-tabs');
    tabs?.select(event.detail.value);
  }
}