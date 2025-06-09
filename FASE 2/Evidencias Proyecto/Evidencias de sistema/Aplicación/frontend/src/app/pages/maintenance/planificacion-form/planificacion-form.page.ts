import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, AbstractControl, ReactiveFormsModule } from '@angular/forms';
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

@Component({
  selector: 'app-planificacion-form',
  templateUrl: './planificacion-form.page.html',
  styleUrls: ['./planificacion-form.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule
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

  // Drag & Drop y Modal Vehículos
  modalVehiculosAbierto = false;
  vehiculosSeleccionados: VehiculoAsignacionInfo[] = [];

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
  }  ngOnInit() {
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

  get tareas(): FormArray {
    return this.planForm.get('tareas') as FormArray;
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
    this.isSubmitted = true;
    this.planForm.markAllAsTouched();

    if (this.planForm.invalid) {
      let errorMsg = 'Por favor, revise el formulario. Hay campos incompletos o con errores.';
      if (this.tareas.invalid && this.tareas.hasError('minlength')) {
        errorMsg += ' Debe agregar al menos una tarea válida.';
      }
      this.mostrarToast(errorMsg, 'warning', 4000);
      return;
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

  abrirModalVehiculos() {
    // Inicializa la selección con los vehículos del formulario
    const ids = this.planForm.value.vehiculosIds || [];
    this.vehiculosSeleccionados = this.vehiculosDisponibles.filter(v => ids.includes(v.idVehi));
    this.modalVehiculosAbierto = true;
  }

  cerrarModalVehiculos() {
    this.modalVehiculosAbierto = false;
  }

  guardarVehiculosSeleccionados() {
    // Actualiza el formulario con los IDs seleccionados
    this.planForm.patchValue({ vehiculosIds: this.vehiculosSeleccionados.map(v => v.idVehi) });
    this.cerrarModalVehiculos();
  }

  onDropVehiculo(event: any, aSeleccionados: boolean) {
    if (event.previousContainer === event.container) {
      // Reordenar dentro de la misma lista
      const arr = aSeleccionados ? this.vehiculosSeleccionados : this.vehiculosDisponibles;
      const [moved] = arr.splice(event.previousIndex, 1);
      arr.splice(event.currentIndex, 0, moved);
    } else {
      // Mover entre listas
      if (aSeleccionados) {
        // De disponibles a seleccionados
        const vehiculo = this.vehiculosDisponibles[event.previousIndex];
        if (!this.vehiculosSeleccionados.some(v => v.idVehi === vehiculo.idVehi)) {
          this.vehiculosSeleccionados.splice(event.currentIndex, 0, vehiculo);
        }
      } else {
        // De seleccionados a disponibles
        const vehiculo = this.vehiculosSeleccionados[event.previousIndex];
        this.vehiculosSeleccionados = this.vehiculosSeleccionados.filter(v => v.idVehi !== vehiculo.idVehi);
      }
    }
  }

  get vehiculosDisponiblesFiltrados() {
    // Excluye los ya seleccionados
    return this.vehiculosDisponibles.filter(v => !this.vehiculosSeleccionados.some(sel => sel.idVehi === v.idVehi));
  }
}