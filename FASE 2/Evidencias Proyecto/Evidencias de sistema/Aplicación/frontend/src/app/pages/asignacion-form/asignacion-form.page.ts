// src/app/pages/asignacion-form/asignacion-form.page.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IonicModule, LoadingController, AlertController, ToastController, NavController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { saveOutline, closeCircleOutline, calendarOutline, speedometerOutline, listOutline, peopleOutline, carSportOutline } from 'ionicons/icons';

import { ApiService, AsignacionRecorrido, AsignacionRecorridoData, Route as RutaPlantilla, VehiculoAsignacionInfo, UsuarioConductorInfo } from '../../services/api.service'; // Asegúrate que las interfaces estén bien importadas

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
    DatePipe           
  ]
})
export class AsignacionFormPage implements OnInit {

  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private loadingCtrl = inject(LoadingController);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private navCtrl = inject(NavController);

  asignacionForm!: FormGroup;
  isEditMode = false;
  asignacionId: number | null = null;
  pageTitle = 'Nueva Asignación de Recorrido';
  isLoading = false;
  isSubmitting = false;


  conductores: UsuarioConductorInfo[] = [];
  rutasPlantilla: RutaPlantilla[] = [];
  vehiculos: VehiculoAsignacionInfo[] = []; 


  estadosAsignacion = ['pendiente', 'asignado', 'en_progreso', 'completado', 'cancelado'];


  constructor() {
    addIcons({ saveOutline, closeCircleOutline, calendarOutline, speedometerOutline, listOutline, peopleOutline, carSportOutline });
  }

  ngOnInit() {
    this.asignacionForm = this.fb.group({
      usuarioIdUsu: [null, Validators.required],
      rutaIdRuta: [null, Validators.required],
      vehiculoIdVehi: [null, Validators.required],
      fecIniRecor: [new Date().toISOString(), Validators.required], // Default a fecha y hora actual
      fecFinRecor: [null], // Opcional al crear
      kmIniRecor: [null, [Validators.required, Validators.min(0)]],
      kmFinRecor: [null, [Validators.min(0)]], // Opcional al crear
      estadoAsig: ['asignado', Validators.required], // Default al crear
      notas: [''],
      efiCombRecor: [null] // Opcional
    });

    this.loadInitialData(); // Cargar conductores, rutas, vehículos

    const idParam = this.activatedRoute.snapshot.paramMap.get('idAsig');
    if (idParam) {
      this.isEditMode = true;
      this.asignacionId = parseInt(idParam, 10);
      this.pageTitle = 'Editar Asignación';
      this.loadAsignacionData();
    } else {
      // Si es nueva asignación, podríamos querer setear kmIniRecor basado en el vehículo seleccionado
      // Esto se podría hacer en un (ionChange) del selector de vehículo
    }
  }

  async loadInitialData() {
    this.isLoading = true;
    const loading = await this.loadingCtrl.create({ message: 'Cargando datos necesarios...' });
    await loading.present();

    try {
      // Cargar conductores (usuarios con rol 'conductor')
      this.apiService.getUsuarios({ rol: 'conductor' }).subscribe(data => this.conductores = data);

      // Cargar rutas plantilla
      this.apiService.getRoutes().subscribe(data => this.rutasPlantilla = data);

      // Cargar vehículos (idealmente solo los 'activos')
      this.apiService.getVehicles({ estado: 'activo' }).subscribe(data => {
        // Mapear a VehiculoAsignacionInfo si es necesario, o ajustar la interfaz Vehiculo
        this.vehiculos = data.map(v => ({
          idVehi: v.idVehi || 0, // Asegurar que idVehi no sea undefined
          patente: v.patente,
          modelo: v.modelo,
          marca: v.marca
        }));
      });

    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
      this.presentToast('Error al cargar datos para el formulario.', 'danger');
    } finally {
      this.isLoading = false;
      loading.dismiss();
    }
  }

  async loadAsignacionData() {
    if (!this.asignacionId) return;
    this.isLoading = true;
    const loading = await this.loadingCtrl.create({ message: 'Cargando asignación...' });
    await loading.present();

    this.apiService.getAsignacionRecorrido(this.asignacionId).subscribe({
      next: (asignacion) => {
        // Formatear fechas para los ion-datetime si es necesario (deben ser ISO 8601)
        const fecIni = asignacion.fecIniRecor ? new Date(asignacion.fecIniRecor).toISOString() : null;
        const fecFin = asignacion.fecFinRecor ? new Date(asignacion.fecFinRecor).toISOString() : null;

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
          efiCombRecor: asignacion.efiCombRecor
        });
        this.isLoading = false;
        loading.dismiss();
      },
      error: async (error) => {
        this.isLoading = false;
        loading.dismiss();
        console.error('Error cargando datos de la asignación:', error);
        this.presentToast(error.message || 'No se pudo cargar la asignación.', 'danger');
        this.navCtrl.navigateBack('/asignacion-list');
      }
    });
  }

  // Manejar cambio de vehículo para autocompletar kmIniRecor
  onVehiculoChange(event: any) {
    const vehiculoId = event.detail.value;
    const vehiculoSeleccionado = this.vehiculos.find(v => v.idVehi === vehiculoId);
    if (vehiculoSeleccionado && !this.isEditMode && this.asignacionForm) { // Solo en modo creación y si el form está listo
      // Necesitamos el km actual del vehículo, que no está en VehiculoAsignacionInfo
      // Podríamos hacer otra llamada a la API o asegurar que getVehicles traiga kmVehi
      // Por ahora, si tuvieras kmVehi en VehiculoAsignacionInfo:
      // this.asignacionForm.patchValue({ kmIniRecor: vehiculoSeleccionado.kmVehi });
      // O buscar en la lista completa de vehículos si la tienes
      this.apiService.getVehicle(vehiculoId).subscribe(veh => {
        if (veh && typeof veh.kmVehi === 'number') {
          this.asignacionForm.patchValue({ kmIniRecor: veh.kmVehi });
        }
      });
    }
  }


  async submitForm() {
    this.isSubmitting = true; // Indicar que el proceso de envío ha comenzado

    if (!this.asignacionForm.valid) {
      this.presentToast('Por favor, completa todos los campos requeridos.', 'warning');
      this.isSubmitting = false; // Resetear si la validación del formulario falla
      Object.values(this.asignacionForm.controls).forEach(control => {
        control.markAsTouched();
      });
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: this.isEditMode ? 'Actualizando asignación...' : 'Creando asignación...'
    });
    await loading.present();

    try {
      const formData = this.asignacionForm.value;

      const kmIniRecorNum = (formData.kmIniRecor !== null && String(formData.kmIniRecor).trim() !== '') ? Number(formData.kmIniRecor) : null;
      if (kmIniRecorNum === null || isNaN(kmIniRecorNum)) {
          this.presentToast('El kilometraje inicial es inválido o no ha sido ingresado.', 'warning');
          // No se pone isSubmitting = false aquí porque el loading se cerrará en el finally
          // y no queremos permitir otro envío mientras se muestra el toast.
          // Lo ideal sería que el toast se muestre y luego se resetee isSubmitting si es necesario.
          // O, mejor aún, que las validaciones previas no dependan de isSubmitting para el mensaje.
          // Por ahora, nos enfocamos en el dismiss del loading.
          await loading.dismiss(); // <--- Dismiss antes de salir por validación
          this.isSubmitting = false;
          return;
      }

      const kmFinRecorNum = (formData.kmFinRecor !== null && String(formData.kmFinRecor).trim() !== '') ? Number(formData.kmFinRecor) : null;

      if (kmFinRecorNum !== null) {
          if (isNaN(kmFinRecorNum)) {
              this.presentToast('El kilometraje final ingresado no es un número válido.', 'warning');
              await loading.dismiss(); // <--- Dismiss
              this.isSubmitting = false;
              return;
          }
          if (kmFinRecorNum <= kmIniRecorNum) {
              this.presentToast('El kilometraje final debe ser mayor que el kilometraje inicial.', 'warning');
              await loading.dismiss(); // <--- Dismiss
              this.isSubmitting = false;
              return;
          }
      } else if (formData.estadoAsig === 'completado') {
          this.presentToast('Para marcar como "Completado", el kilometraje final es requerido y debe ser válido.', 'warning');
          await loading.dismiss(); // <--- Dismiss
          this.isSubmitting = false;
          return;
      }

      const asignacionData: AsignacionRecorridoData = {
        usuarioIdUsu: parseInt(formData.usuarioIdUsu, 10),
        rutaIdRuta: parseInt(formData.rutaIdRuta, 10),
        vehiculoIdVehi: parseInt(formData.vehiculoIdVehi, 10),
        fecIniRecor: new Date(formData.fecIniRecor).toISOString(),
        fecFinRecor: formData.fecFinRecor ? new Date(formData.fecFinRecor).toISOString() : null,
        kmIniRecor: kmIniRecorNum,
        kmFinRecor: kmFinRecorNum,
        estadoAsig: formData.estadoAsig,
        notas: formData.notas,
        efiCombRecor: (formData.efiCombRecor !== null && String(formData.efiCombRecor).trim() !== '') ? Number(formData.efiCombRecor) : null
      };

      if (asignacionData.fecFinRecor && asignacionData.fecIniRecor &&
          new Date(asignacionData.fecFinRecor) <= new Date(asignacionData.fecIniRecor)) {
          this.presentToast('La fecha de fin debe ser posterior a la fecha de inicio.', 'warning');
          await loading.dismiss(); // <--- Dismiss
          this.isSubmitting = false;
          return;
      }

      const operation = this.isEditMode && this.asignacionId
        ? this.apiService.updateAsignacionRecorrido(this.asignacionId, asignacionData)
        : this.apiService.createAsignacionRecorrido(asignacionData);

      // Usaremos async/await con el observable para un manejo más limpio del loading
      await operation.toPromise(); // Convierte el Observable a Promesa para usar con await

      // Si llegamos aquí, la operación fue exitosa (toPromise() resuelve o rechaza)
      this.presentToast(`Asignación ${this.isEditMode ? 'actualizada' : 'creada'} exitosamente.`, 'success');
      this.navCtrl.navigateBack('/asignacion-lis');

    } catch (error: any) { // Captura errores de la promesa o de validaciones previas
      console.error('Error al guardar asignación:', error);
      // El error de ApiService ya debería ser un objeto con 'message'
      const errorMsg = error && error.message ? error.message : 'No se pudo guardar la asignación.';
      this.presentToast(errorMsg, 'danger');
    } finally {
      // Este bloque finally se ejecutará SIEMPRE, haya éxito o error,
      // asegurando que el loading se cierre.
      this.isSubmitting = false; // Resetear el estado de envío
      if (loading) {
        await loading.dismiss();
      }
    
    };
  }

  async presentToast(message: string, color: 'success' | 'warning' | 'danger' | 'primary' | 'medium' = 'medium', duration: number = 3000) {
    const toast = await this.toastCtrl.create({ message, duration, color, position: 'bottom' });
    toast.present();
  }
}
