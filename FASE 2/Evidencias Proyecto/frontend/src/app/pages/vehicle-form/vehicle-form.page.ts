import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, LoadingController, AlertController, ToastController, NavController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router'; 
import { addIcons } from 'ionicons';
import { save } from 'ionicons/icons'; 

import { ApiService, Vehicle } from '../../services/api.service';

@Component({
  selector: 'app-vehicle-form',
  templateUrl: './vehicle-form.page.html',
  styleUrls: ['./vehicle-form.page.scss'],
  standalone: true,

  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class VehicleFormPage implements OnInit {

  // --- Inyecciones ---
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private loadingCtrl = inject(LoadingController);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private navCtrl = inject(NavController);

  // --- Propiedades ---
  vehicleForm!: FormGroup;
  isEditMode = false;
  vehicleId: number | null = null;
  pageTitle = 'Nuevo Vehículo';
  isLoading = false;
  isSubmitted = false;

  
  vehicleStatuses: string[] = ['activo', 'inactivo', 'mantenimiento', 'taller'];

  constructor() {
    addIcons({ save });
  }

  ngOnInit() {
    // Inicializar el formulario con todos los campos y validaciones básicas
    this.vehicleForm = this.fb.group({
      
      name: ['', Validators.required],
      plate: ['', Validators.required],
      status: ['activo', Validators.required], 
      latitude: [0], 
      longitude: [0], 
      anio: [null], 
      marca: [''],
      modelo: [''],
      chasis: [''], 
      tipoVehiculo: [''],
      proyecto: [''],
      kilometraje: [0] 
    });

    // Detectar si estamos editando
    const idParam = this.activatedRoute.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.vehicleId = parseInt(idParam, 10);
      this.pageTitle = 'Editar Vehículo';
      if (!isNaN(this.vehicleId)) {
          this.loadVehicleData(); // Cargar datos si el ID es válido
      } else {
          console.error("ID de vehículo inválido recibido para editar.");
          this.presentAlert('Error', 'ID de vehículo inválido.');
          this.navCtrl.navigateBack('/vehiculos');
      }
    }
  }

  // Cargar datos del vehículo para edición
  async loadVehicleData() {
    if (!this.vehicleId) return;

    this.isLoading = true;
    const loading = await this.loadingCtrl.create({ message: 'Cargando datos...' });
    await loading.present();

    this.apiService.getVehicle(this.vehicleId).subscribe({
      next: (data) => {
        this.isLoading = false;
        loading.dismiss();
    
        this.vehicleForm.patchValue(data);
        console.log('Datos cargados para edición:', data);
      },
      error: async (err) => {
        this.isLoading = false;
        loading.dismiss();
        console.error("Error cargando datos del vehículo:", err);
        await this.presentAlert('Error', 'No se pudieron cargar los datos del vehículo.');
        this.navCtrl.back();
      }
    });
  }

  // Guardar (Crear o Actualizar)
  async saveVehicle() {
    this.isSubmitted = true; 
    if (this.vehicleForm.invalid) {
        this.presentToast('Por favor, completa los campos requeridos.', 'warning');
        return; 
    }

    const loading = await this.loadingCtrl.create({
         message: this.isEditMode ? 'Actualizando Vehículo...' : 'Creando Vehículo...'
    });
    await loading.present();

    // Obtener los datos del formulario
    const vehicleData = this.vehicleForm.value;
   
    vehicleData.anio = vehicleData.anio ? parseInt(vehicleData.anio, 10) : null;
    vehicleData.kilometraje = vehicleData.kilometraje ? parseInt(vehicleData.kilometraje, 10) : 0;
  

    // Determinar la acción (Crear o Actualizar)
    const saveObservable = this.isEditMode
        ? this.apiService.updateVehicle(this.vehicleId!, vehicleData) 
        : this.apiService.createVehicle(vehicleData);      

    saveObservable.subscribe({
        next: async (savedVehicle) => {
            await loading.dismiss();
            await this.presentToast(`Vehículo ${this.isEditMode ? 'actualizado' : 'creado'} exitosamente.`, 'success');
            this.navCtrl.navigateBack('/vehiculos');
        },
        error: async (error) => {
            await loading.dismiss();
            console.error("Error guardando vehículo:", error);

            const errorMessage = error?.message || 'Ocurrió un error desconocido.';
            await this.presentAlert('Error al Guardar', `No se pudo guardar el vehículo. ${errorMessage}`);
        }
    });
  }


  async presentAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({ header, message, buttons: ['OK'] });
    await alert.present();
  }

  async presentToast(message: string, color: 'success'|'warning'|'danger'|'medium' = 'medium') {
    const toast = await this.toastCtrl.create({ message, duration: 2500, position: 'bottom', color });
    toast.present();
  }

}