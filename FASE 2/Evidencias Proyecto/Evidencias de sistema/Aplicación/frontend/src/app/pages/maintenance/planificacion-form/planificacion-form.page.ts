import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; // Para *ngIf, *ngFor
import { IonicModule } from '@ionic/angular';   // Para todos los componentes Ionic
import { NavController, ToastController, LoadingController, AlertController } from '@ionic/angular';
import { ApiService, VehiculoAsignacionInfo, PlanificacionMantenimientoData } from '../../../services/api.service'; // Ajusta la ruta

@Component({
  selector: 'app-planificacion-form',
  templateUrl: './planificacion-form.page.html',
  styleUrls: ['./planificacion-form.page.scss'],
  standalone: true, // Indica que es un componente standalone
  imports: [
    CommonModule,        // Para directivas como *ngIf, *ngFor
    ReactiveFormsModule, // Para FormGroup, FormControlName, FormArray, etc.
    IonicModule,         // Importa TODOS los componentes de Ionic y directivas necesarias
    // RouterModule // No es necesario aquí si solo usas ion-back-button y no routerLink
  ]
})
export class PlanificacionFormPage implements OnInit {
  planForm!: FormGroup;
  vehiculosDisponibles: VehiculoAsignacionInfo[] = [];
  isSubmitted = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private navCtrl: NavController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController // Aunque no se usa directamente en el submit, es bueno tenerlo
  ) {}

  ngOnInit() {
    this.initForm();
    this.cargarVehiculos();
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

    const loading = await this.loadingCtrl.create({ message: 'Guardando planificación...' });
    await loading.present();

    const formData = this.planForm.value as PlanificacionMantenimientoData;
    console.log('Datos del formulario a enviar al backend:', formData);

    this.apiService.crearPlanificacion(formData).subscribe({
      next: async (response) => {
        await loading.dismiss();
        this.mostrarToast(`Planificación "${response.planificacion.descPlan}" creada exitosamente.`, 'success');
        this.planForm.reset({
          esPreventivo: true,
          esActivoPlan: true,
          vehiculosIds: [],
        });
        this.tareas.clear();
        this.agregarTarea();
        this.isSubmitted = false;
        // Ajusta la ruta a tu lista de planificaciones, puede ser con tabs o directa
        this.navCtrl.navigateRoot('/tabs/planificaciones', { animationDirection: 'back' });
      },
      error: async (error) => {
        await loading.dismiss();
        console.error('Error al crear planificación desde el frontend:', error);
        this.mostrarToast(error.message || 'No se pudo crear la planificación. Intente más tarde.', 'danger', 5000);
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
}