import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; 
import { IonicModule } from '@ionic/angular';   
import { NavController, ToastController, LoadingController, ModalController } from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  closeOutline, saveOutline, addCircleOutline, removeCircleOutline,
  closeCircleOutline 
} from 'ionicons/icons';
import { takeUntil } from 'rxjs/operators';

import { BaseFormComponent } from '../../../core/base/base-form.component';
import { MaintenanceService } from '../../../core/services/maintenance.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { AlertService } from '../../../core/services/alert.service';
import { MAINTENANCE_CONSTANTS, ENTITY_NAMES } from '../../../core/constants';
import { ApiService, VehiculoAsignacionInfo, PlanificacionMantenimientoData, PlanificacionMantenimientoResumen } from '../../../core/services/api.service';
import { FormFieldComponent } from '../../../shared/components/form-field/form-field.component';
import { currentDate } from 'src/app/core';
import { ModalHeaderComponent } from 'src/app/shared';
import { ModalFooterComponent } from 'src/app/shared';

// Constants for better maintainability (usando las nuevas constantes refactorizadas)
const FORM_CONFIG = {
  MIN_TASKS: 1,
  MAX_DESCRIPTION_LENGTH: 255,
  MIN_DESCRIPTION_LENGTH: 5,
  MAX_TASK_NAME_LENGTH: 150,
  MAX_TASK_DESCRIPTION_LENGTH: 500,
  MIN_FREQUENCY: 1,
} as const;

const UI_CONFIG = {
  TOAST_DURATION: 3000,
  ERROR_TOAST_DURATION: 5000,
  TAB_CHANGE_DELAY: 300,
  ANIMATION_DURATION: 1000,
} as const;

const TABS = {
  INFO_GENERAL: 'infoGeneral',
  TAREAS_PLANIFICACION: 'tareasPlanificacion',
} as const;

type TabType = typeof TABS[keyof typeof TABS];

// Interface for validation errors
interface ValidationError {
  id: string;
  tab: TabType;
}

// Interface for form field names mapping
interface FieldNameMapping {
  [key: string]: string;
}

@Component({
  selector: 'app-planificacion-form',
  templateUrl: './planificacion-form.page.html',
  styleUrls: ['./planificacion-form.page.scss'],  standalone: true,  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    FormsModule,
    ModalHeaderComponent,
    ModalFooterComponent
  ]
})
export class PlanificacionFormPage extends BaseFormComponent implements OnInit {
  @Input() planId?: number;
  @Input() isEditMode: boolean = false;
  @Input() isViewMode: boolean = false;
  
  // Form implementation required by BaseFormComponent
  form!: FormGroup;
  
  // Form and UI state
  planForm!: FormGroup;
  vehiculosDisponibles: VehiculoAsignacionInfo[] = [];
  isSubmitted = false;
  pageTitle = 'Crear Planificación';
  selectedTab: TabType = TABS.INFO_GENERAL;
  esPreventivo: boolean = true;
  
  // Nuevas constantes refactorizadas
  readonly constants = MAINTENANCE_CONSTANTS;
    tipoFrecuenciaSeleccionado: string = '';

  
  currentDate: string = currentDate;
  
  // Data for edit mode
  private loadedTareas: any[] = [];
  private loadedVehiculosIds: number[] = [];
  
  // Field names mapping for user-friendly error messages
  private readonly fieldNameMapping: FieldNameMapping = {
    descPlan: 'nombre del mantenimiento',
    tipoFrecuencia: 'tipo de frecuencia',
    frecuencia: 'frecuencia',
    vehiculosIds: 'vehículos asignados',
  };  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private maintenanceService: MaintenanceService,
    private vehicleService: VehicleService,
    private navCtrl: NavController,
    private modalCtrl: ModalController,
    private alertService: AlertService,
    private route: ActivatedRoute,
    loadingCtrl: LoadingController,
    toastCtrl: ToastController
  ) {
    super(loadingCtrl, toastCtrl);
    this.initializeIcons();
  }

  private initializeIcons(): void {
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
    
    
    if (this.planId && (this.isEditMode || this.isViewMode)) {
      this.loadPlanificacionData();
    } else {
    
      this.agregarTarea();
    }    this.initializeFormValidation();
  }

  private initializeFormValidation(): void {
    // Subscribe to form value changes for validation
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
  }  initForm(): void {
    this.planForm = this.fb.group({
      descPlan: ['', [
        Validators.required, 
        Validators.minLength(FORM_CONFIG.MIN_DESCRIPTION_LENGTH), 
        Validators.maxLength(FORM_CONFIG.MAX_DESCRIPTION_LENGTH)
      ]],
      frecuencia: [null, [
        Validators.required, 
        Validators.min(FORM_CONFIG.MIN_FREQUENCY)
      ]],
      tipoFrecuencia: ['', Validators.required],
      fechaActivacion: [currentDate],
      esPreventivo: [true, Validators.required],
      esActivoPlan: [true, Validators.required],
      vehiculosIds: [[], [
        Validators.required, 
        Validators.minLength(FORM_CONFIG.MIN_TASKS)
      ]],
      tareas: this.fb.array([], [
        Validators.required, 
        Validators.minLength(FORM_CONFIG.MIN_TASKS)
      ])
    });
    
    this.ensureMinimumTasks();
  }

  private ensureMinimumTasks(): void {
    if (this.tareas.length === 0) {
      this.agregarTarea(); 
    }
  }

 
  get f() { return this.planForm.controls; }

  get tareas(): FormArray {
    return this.planForm.get('tareas') as FormArray;
  }
  crearTareaFormGroup(): FormGroup {
    return this.fb.group({
      nomTareaPlan: ['', [
        Validators.required, 
        Validators.maxLength(FORM_CONFIG.MAX_TASK_NAME_LENGTH)
      ]], 
      descTareaPlan: ['', [
        Validators.maxLength(FORM_CONFIG.MAX_TASK_DESCRIPTION_LENGTH)
      ]]  
    });
  }

  agregarTarea(): void {
    this.tareas.push(this.crearTareaFormGroup());
  }
  eliminarTarea(index: number): void {
    if (this.tareas.length > FORM_CONFIG.MIN_TASKS) {
      this.tareas.removeAt(index);
    } else {
      this.mostrarToast('Una planificación debe tener al menos una tarea.', 'warning');
    }
  }
  cargarVehiculos(): void {
    this.apiService.getVehiculosDisponibles().subscribe({
      next: (data) => {
        this.vehiculosDisponibles = data;
      },
      error: (error) => {
        console.error('Error cargando vehículos:', error);
        this.mostrarToast(error.message || 'Error al cargar la lista de vehículos.', 'danger');      }
    });
  }
  
  async onSubmit(): Promise<void> {
    if (!this.validateForm()) {
      return;
    }

    // Utilizamos el servicio de alertas para confirmaciones
    const confirmed = this.isEditMode 
      ? await this.alertService.confirmEdit(ENTITY_NAMES.MAINTENANCE)
      : await this.alertService.confirmCreate(ENTITY_NAMES.MAINTENANCE);
    
    if (!confirmed) return;

    await this.submitForm();
  }

  private validateForm(): boolean {
    this.isSubmitted = true;
    this.planForm.markAllAsTouched();
    
    if (this.planForm.invalid) {
      this.handleFormValidationError();
      return false;
    }
    return true;
  }

  private handleFormValidationError(): void {
    const firstError = this.getFirstError();
    if (!firstError) return;

    try {
      this.navigateToErrorTab(firstError);
    } catch (error) {
      console.error('Error al cambiar de tab:', error);
      this.mostrarToast('Por favor, revise todos los campos del formulario.', 'warning');
    }
  }
  private navigateToErrorTab(firstError: ValidationError): void {
    if (this.selectedTab !== firstError.tab) {
      this.selectedTab = firstError.tab;
      setTimeout(() => {
        this.focusOnError(firstError);
      }, UI_CONFIG.TAB_CHANGE_DELAY);
    } else {
      this.focusOnError(firstError);
    }
  }
  private async submitForm(): Promise<void> {
    const isEditMode = Boolean(this.isEditMode && this.planId);
    const loading = await this.loadingCtrl.create({ 
      message: isEditMode ? 'Actualizando planificación...' : 'Guardando planificación...' 
    });
    await loading.present();

    const planData = this.buildPlanData();
    console.log('Datos de la planificación a enviar:', planData);

    const apiCall = isEditMode 
      ? this.apiService.updatePlanificacion(this.planId!, planData as PlanificacionMantenimientoData)
      : this.apiService.crearPlanificacion(planData as PlanificacionMantenimientoData);

    apiCall.subscribe({
      next: async (response) => {
        await loading.dismiss();
        await this.handleSubmitSuccess(response, isEditMode, planData);
      },
      error: async (error) => {
        await loading.dismiss();
        await this.handleSubmitError(error, isEditMode);
      }
    });
  }

  private buildPlanData(): Partial<PlanificacionMantenimientoData> {
    return {
      descPlan: this.planForm.value.descPlan,
      frecuencia: this.planForm.value.frecuencia,
      tipoFrecuencia: this.planForm.value.tipoFrecuencia,
      fechaActivacion: this.planForm.value.fechaActivacion, 
      esPreventivo: this.planForm.value.esPreventivo,
      esActivoPlan: this.planForm.value.esActivoPlan,
      vehiculosIds: this.planForm.value.vehiculosIds,
      tareas: this.tareas.value
    };
  }

  private async handleSubmitSuccess(
    response: any, 
    isEditMode: boolean, 
    planData: Partial<PlanificacionMantenimientoData>
  ): Promise<void> {
    const message = isEditMode 
      ? `Planificación actualizada exitosamente.`
      : `Planificación "${response.planificacion?.descPlan || planData.descPlan}" creada exitosamente.`;
    
    this.mostrarToast(message, 'success');
    
    if (this.modalCtrl) {
      await this.closeModal({ 
        planificacionCreated: !isEditMode, 
        planificacionUpdated: isEditMode 
      });
    } else {
      await this.handleNonModalSuccess(isEditMode);
    }
  }

  private async handleNonModalSuccess(isEditMode: boolean): Promise<void> {
    if (!isEditMode) {
      this.resetForm();
    }
    this.navCtrl.navigateRoot('/tabs/planificaciones', { animationDirection: 'back' });
  }

  private resetForm(): void {
    this.planForm.reset({
      esPreventivo: true,
      esActivoPlan: true,
      vehiculosIds: [],
    });
    this.tareas.clear();
    this.agregarTarea();
    this.isSubmitted = false;
  }

  private async handleSubmitError(error: any, isEditMode: boolean): Promise<void> {
    console.error('Error al procesar planificación:', error);
    const errorMessage = isEditMode 
      ? 'No se pudo actualizar la planificación. Intente más tarde.'
      : 'No se pudo crear la planificación. Intente más tarde.';
    this.mostrarToast(error.message || errorMessage, 'danger', UI_CONFIG.ERROR_TOAST_DURATION);
  }
  private focusOnError(firstError: ValidationError): void {
    const errorElement = document.getElementById(firstError.id);
    if (!errorElement) return;

    this.scrollToErrorElement(errorElement);
    this.showFieldValidationMessage(firstError.id);
  }

  private scrollToErrorElement(element: HTMLElement): void {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.classList.add('shake-animation');
    setTimeout(() => element.classList.remove('shake-animation'), UI_CONFIG.ANIMATION_DURATION);
  }

  private showFieldValidationMessage(fieldId: string): void {
    const fieldName = this.getFieldDisplayName(fieldId);
    this.mostrarToast(`Por favor, complete el ${fieldName} correctamente.`, 'warning');
  }

  private getFieldDisplayName(fieldId: string): string {
    if (fieldId in this.fieldNameMapping) {
      return this.fieldNameMapping[fieldId];
    }
    return fieldId.includes('tarea') ? 'tarea' : 'campo';
  }
  getFirstError(): ValidationError | null {
    // Check main form fields
    if (this.f['descPlan'].invalid) return { id: 'descPlan', tab: TABS.INFO_GENERAL };
    if (this.f['tipoFrecuencia'].invalid) return { id: 'tipoFrecuencia', tab: TABS.INFO_GENERAL };
    if (this.f['frecuencia'].invalid) return { id: 'frecuencia', tab: TABS.INFO_GENERAL };
    if (this.f['vehiculosIds'].invalid) return { id: 'vehiculosIds', tab: TABS.INFO_GENERAL };

    // Check tasks
    const tareas = this.tareas.controls;
    for (let i = 0; i < tareas.length; i++) {
      const tarea = tareas[i];
      if (tarea.get('nomTareaPlan')?.invalid) {
        return { id: `tarea-${i}-nombre`, tab: TABS.TAREAS_PLANIFICACION };
      }
      if (tarea.get('descTareaPlan')?.invalid) {
        return { id: `tarea-${i}-descripcion`, tab: TABS.TAREAS_PLANIFICACION };
      }
    }

    return null;  }
  
  // Legacy method alias for backward compatibility
  async mostrarToast(mensaje: string, color: string = 'dark', duracion: number = UI_CONFIG.TOAST_DURATION): Promise<void> {
    return this.showToast(mensaje, color);
  }

  // Data loading methods
  async loadPlanificacionData(): Promise<void> {
    if (!this.planId) return;

    const loading = await this.loadingCtrl.create({ message: 'Cargando planificación...' });
    await loading.present();

    this.apiService.getPlanificacionById(this.planId).subscribe({
      next: async (data) => {
        await loading.dismiss();
        this.populateFormWithLoadedData(data);
        console.log('Planificación cargada:', data);
      },
      error: async (error) => {
        await loading.dismiss();
        console.error('Error al cargar planificación:', error);
        this.mostrarToast(error.message || 'Error al cargar la planificación', 'danger');
      }
    });
  }
  private populateFormWithLoadedData(data: any): void {
    this.planForm.patchValue({
      descPlan: data.descPlan,
      frecuencia: data.frecuencia,
      fechaActivacion: data.fechaActivacion,
      tipoFrecuencia: data.tipoFrecuencia,
      esActivoPlan: data.esActivoPlan,
      esPreventivo: data.esPreventivo
    });

    // Inicializar la variable para habilitar el campo de frecuencia
    this.tipoFrecuenciaSeleccionado = data.tipoFrecuencia || '';

    this.loadedTareas = data.tareas || [];
    this.loadedVehiculosIds = data.vehiculosEnPlan?.map((v: any) => v.idVehi) || [];

    this.cargarTareasEnFormulario();
    this.planForm.patchValue({ vehiculosIds: this.loadedVehiculosIds });
  }

  private cargarTareasEnFormulario(): void {
    this.tareas.clear();

    if (this.loadedTareas.length > 0) {
      this.loadedTareas.forEach(() => {
        this.agregarTarea();
      });

      this.loadedTareas.forEach((tarea, index) => {
        const tareaControl = this.tareas.at(index);
        tareaControl.patchValue({
          nomTareaPlan: tarea.nomTareaPlan,
          descTareaPlan: tarea.descTareaPlan || ''
        });
      });
    } else {
      this.agregarTarea();
    }
  }
  // Event handlers
  onTipoFrecuenciaChange(event: any): void {
    const tipoFrecuenciaSeleccionado = event.detail?.value || null;
    this.tipoFrecuenciaSeleccionado = tipoFrecuenciaSeleccionado || '';
    
    if (!tipoFrecuenciaSeleccionado) {
      this.planForm.get('frecuencia')?.reset();
    }
  }

  segmentChanged(event: any): void {
    this.selectedTab = event.detail.value;
  }
  
  // Utility methods
  async closeModal(data?: any): Promise<void> {
    await this.modalCtrl.dismiss(data);
  }

  // Utility functions
  override compareWith = (o1: any, o2: any) => {
    return o1 === o2;
  };
}