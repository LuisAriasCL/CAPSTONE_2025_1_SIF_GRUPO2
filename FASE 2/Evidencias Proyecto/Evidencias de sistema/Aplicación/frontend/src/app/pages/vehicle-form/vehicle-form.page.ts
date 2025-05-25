import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, LoadingController, AlertController, ToastController, NavController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { addIcons } from 'ionicons';
// Importamos el icono de save y el de la flecha para el botón de retroceso
import { save, arrowBackOutline as ionArrowBackOutline } from 'ionicons/icons';

// Asegúrate de que ApiService ahora exporta Vehiculo y los tipos relacionados,
// o créalos en un archivo .interface.ts e impórtalos desde allí.
import { ApiService, Vehiculo, EstadoVehiculo, TipoCombustibleVehiculo } from '../../services/api.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-vehicle-form',
  templateUrl: './vehicle-form.page.html',
  styleUrls: ['./vehicle-form.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class VehicleFormPage implements OnInit {

  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private router = inject(Router); // router no se usaba activamente, pero se mantiene
  private activatedRoute = inject(ActivatedRoute);
  private loadingCtrl = inject(LoadingController);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private navCtrl = inject(NavController);

  vehicleForm!: FormGroup;
  isEditMode = false;
  vehicleId: number | null = null;
  pageTitle = 'Nuevo Vehículo';
  // isLoading e isSubmitted se manejaban en tu código, los mantengo si son útiles para tu lógica de UI
  isLoading = false; 
  isSubmitted = false; // Para controlar el envío del formulario

  // Opciones para los selectores
  estadosVehiculoOptions: Array<EstadoVehiculo> = [
    'activo', 'inactivo', 'mantenimiento', 'taller'
  ];
  tiposCombustibleOptions: Array<TipoCombustibleVehiculo | null> = [
    null, 'gasolina_93', 'gasolina_95', 'gasolina_97', 'diesel', 'electrico', 'otro'
  ];

  constructor() {
    // Registramos los iconos para que Ionic los reconozca por nombre
    addIcons({ save, 'arrow-back-outline': ionArrowBackOutline });
  }

  ngOnInit() {
    this.vehicleForm = this.fb.group({
      // Campos basados en la nueva interfaz Vehiculo (camelCase español)
      // Campos eliminados: name, proyecto
      // Campos renombrados: plate -> patente, status -> estadoVehi, kilometraje -> kmVehi, tipoVehiculo -> tipoVehi
      // Campos nuevos: fecAdqui, tipoCombVehi, kmVidaUtil, efiComb

      patente: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]], // Antes: plate
      chasis: ['', [Validators.required, Validators.minLength(17), Validators.maxLength(17)]], // Ya existía, se mantiene
      marca: ['', Validators.required], // Ya existía, se mantiene (agregamos required)
      modelo: ['', Validators.required], // Ya existía, se mantiene (agregamos required)
      anio: [null, [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear() + 5)]], // Ya existía
      kmVehi: [0, [Validators.required, Validators.min(0)]], // Antes: kilometraje
      fecAdqui: ['', Validators.required], // NUEVO Y REQUERIDO
      estadoVehi: ['activo', Validators.required], // Antes: status

      tipoVehi: [''], // Antes: tipoVehiculo (string libre, opcional)
      tipoCombVehi: [null], // NUEVO OPCIONAL
      kmVidaUtil: [null, [Validators.min(0)]], // NUEVO OPCIONAL
      efiComb: [null, [Validators.min(0)]],    // NUEVO OPCIONAL
      latitud: [null, [Validators.min(-90), Validators.max(90)]],   // Ya existía, pero ahora es opcional
      longitud: [null, [Validators.min(-180), Validators.max(180)]] // Ya existía, pero ahora es opcional
    });

    const idParam = this.activatedRoute.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.vehicleId = parseInt(idParam, 10);
      this.pageTitle = 'Editar Vehículo';
      if (!isNaN(this.vehicleId)) {
        this.loadVehicleData();
      } else {
        console.error("ID de vehículo inválido recibido para editar:", idParam);
        this.presentAlert('Error', 'ID de vehículo inválido.');
        this.navCtrl.navigateBack('/vehicle-list'); // Ajusta la ruta si es diferente
      }
    }
  }

  async loadVehicleData() {
    if (!this.vehicleId) return;

    this.isLoading = true; // Manteniendo tu lógica de isLoading
    const loading = await this.loadingCtrl.create({ message: 'Cargando datos...' });
    await loading.present();

    this.apiService.getVehicle(this.vehicleId).subscribe({
      next: (data: Vehiculo) => { // Tipar data como Vehiculo
        this.isLoading = false;
        loading.dismiss();

        let fecAdquiParaForm = data.fecAdqui;
        if (fecAdquiParaForm && !(typeof fecAdquiParaForm === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecAdquiParaForm))) {
          fecAdquiParaForm = new Date(fecAdquiParaForm).toISOString().split('T')[0];
        }
        
        // Mapear los datos recibidos (con nombres en español) a los formControls (con nombres en español)
        this.vehicleForm.patchValue({
          patente: data.patente,
          chasis: data.chasis,
          marca: data.marca,
          modelo: data.modelo,
          anio: data.anio,
          kmVehi: data.kmVehi,
          fecAdqui: fecAdquiParaForm,
          estadoVehi: data.estadoVehi,
          tipoVehi: data.tipoVehi,
          tipoCombVehi: data.tipoCombVehi,
          kmVidaUtil: data.kmVidaUtil,
          efiComb: data.efiComb,
          latitud: data.latitud,
          longitud: data.longitud
        });
        console.log('Datos cargados para edición:', this.vehicleForm.value);
      },
      error: async (err: HttpErrorResponse | Error) => { // Tipar err
        this.isLoading = false;
        loading.dismiss();
        console.error("Error cargando datos del vehículo:", err);
        const message = (err instanceof HttpErrorResponse) ? (err.error?.message || err.message) : err.message;
        await this.presentAlert('Error', `No se pudieron cargar los datos del vehículo. ${message}`);
        this.navCtrl.navigateBack('/vehicle-list'); // Usar navigateBack con la ruta correcta
      }
    });
  }

  async saveVehicle() {
    this.isSubmitted = true;
    if (this.vehicleForm.invalid) {
      Object.values(this.vehicleForm.controls).forEach(control => {
        control.markAsTouched(); // Marcar todos para mostrar errores de validación
      });
      this.presentToast('Por favor, completa los campos requeridos correctamente.', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: this.isEditMode ? 'Actualizando Vehículo...' : 'Creando Vehículo...'
    });
    await loading.present();

    // this.vehicleForm.value ya tiene las claves en camelCase español
    const vehicleDataFromForm = this.vehicleForm.value;
    
    // Construir el objeto Vehiculo para enviar, asegurando tipos correctos
    const vehicleDataToSend: any = { // Empezamos con any para flexibilidad y luego asignamos a Vehiculo
      patente: vehicleDataFromForm.patente,
      chasis: vehicleDataFromForm.chasis,
      marca: vehicleDataFromForm.marca,
      modelo: vehicleDataFromForm.modelo,
      anio: Number(vehicleDataFromForm.anio),
      kmVehi: Number(vehicleDataFromForm.kmVehi),
      fecAdqui: vehicleDataFromForm.fecAdqui, // Ya debería ser YYYY-MM-DD
      estadoVehi: vehicleDataFromForm.estadoVehi,
      tipoVehi: vehicleDataFromForm.tipoVehi || null, // Enviar null si está vacío
      tipoCombVehi: vehicleDataFromForm.tipoCombVehi, // Puede ser null desde el select
      kmVidaUtil: vehicleDataFromForm.kmVidaUtil !== null && vehicleDataFromForm.kmVidaUtil !== '' ? Number(vehicleDataFromForm.kmVidaUtil) : null,
      efiComb: vehicleDataFromForm.efiComb !== null && vehicleDataFromForm.efiComb !== '' ? Number(vehicleDataFromForm.efiComb) : null,
      latitud: vehicleDataFromForm.latitud !== null && vehicleDataFromForm.latitud !== '' ? Number(vehicleDataFromForm.latitud) : null,
      longitud: vehicleDataFromForm.longitud !== null && vehicleDataFromForm.longitud !== '' ? Number(vehicleDataFromForm.longitud) : null,
    };
    
    // Si es edición, incluimos el idVehi (aunque no esté en el form directamente)
    // El ApiService espera el ID como parámetro separado para updateVehicle,
    // y no necesita idVehi en el payload para createVehicle.

    const saveObservable = this.isEditMode && this.vehicleId !== null
      ? this.apiService.updateVehicle(this.vehicleId, vehicleDataToSend as Partial<Vehiculo>) // Cast a Partial<Vehiculo>
      : this.apiService.createVehicle(vehicleDataToSend as Vehiculo); // Cast a Vehiculo

    saveObservable.subscribe({
      next: async (savedVehicle: Vehiculo) => {
        await loading.dismiss();
        await this.presentToast(`Vehículo ${this.isEditMode ? 'actualizado' : 'creado'} exitosamente.`, 'success');
        this.navCtrl.navigateBack('/vehicle-list'); // Navegar a la lista
      },
      error: async (error: HttpErrorResponse | Error) => {
        await loading.dismiss();
        console.error("Error guardando vehículo:", error);
        const message = (error instanceof HttpErrorResponse) ? (error.error?.message || error.message) : error.message;
        await this.presentAlert('Error al Guardar', `No se pudo guardar el vehículo. ${message}`);
      }
    });
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({ header, message, buttons: ['OK'] });
    await alert.present();
  }

  async presentToast(message: string, color: 'success' | 'warning' | 'danger' | 'medium' = 'medium') {
    const toast = await this.toastCtrl.create({ message, duration: 2500, position: 'bottom', color });
    toast.present();
  }

  // Helper para acceder a los controles del formulario en la plantilla para mostrar errores
  get f() {
    return this.vehicleForm.controls;
  }
}