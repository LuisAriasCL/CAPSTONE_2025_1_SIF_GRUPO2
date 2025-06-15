import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-incidente-movil',
  templateUrl: './incidente-movil.page.html',
  styleUrls: ['./incidente-movil.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule]
})
export class IncidenteMovilPage implements OnInit {

  incidenteForm: FormGroup;
  vehiculoAsignado: any = null;
  fotoFile: File | null = null;
  imageSrc: string | ArrayBuffer | null = null;
  // 1. AÑADIMOS UNA VARIABLE PARA EL ESTADO DE CARGA
  isVehicleLoading = true;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService,
    private navCtrl: NavController,
    private toastController: ToastController
  ) {
    const ahora = new Date();
    this.incidenteForm = this.fb.group({
      vehiculoDisplay: [{ value: null, disabled: true }], // Campo solo para mostrar
      vehiculoId: [null, Validators.required],
      fecha: [ahora.toISOString(), Validators.required],
      tipo: [null, Validators.required],
      descripcion: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.cargarVehiculoAsignado();
  }

  cargarVehiculoAsignado() {
    this.isVehicleLoading = true; // Inicia la carga
    const usuario = this.authService.getCurrentUser();
    if (!usuario) {
      this.presentToast('No se pudo identificar al conductor.');
      this.isVehicleLoading = false; // Termina la carga
      return;
    }

    this.apiService.getVehiculoActivo(usuario.idUsu).subscribe({
      next: (vehiculo) => {
        if (vehiculo) {
          this.vehiculoAsignado = vehiculo;
          // Llenamos el ID para enviarlo y el campo de texto para mostrarlo
          this.incidenteForm.patchValue({ 
            vehiculoId: vehiculo.idVehi,
            vehiculoDisplay: `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.patente})`
          });
        } else {
          this.presentToast('No tienes un vehículo asignado.');
          this.incidenteForm.disable();
        }
        this.isVehicleLoading = false; // Termina la carga
      },
      error: () => {
        this.presentToast('Error al cargar la información del vehículo.');
        this.incidenteForm.disable();
        this.isVehicleLoading = false; // Termina la carga
      }
    });
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.fotoFile = file;
      const reader = new FileReader();
      reader.onload = () => { this.imageSrc = reader.result; };
      reader.readAsDataURL(file);
    }
  }
  
  // Función para limpiar la foto seleccionada
  clearPhoto(fileInput: any) {
    this.imageSrc = null;
    this.fotoFile = null;
    fileInput.value = ''; // Resetea el input de archivo
  }

  async registrarIncidente() {
    if (this.incidenteForm.invalid) {
      this.presentToast('Por favor, completa todos los campos.');
      return;
    }

    const formData = new FormData();
    const usuario = this.authService.getCurrentUser();
    const formValue = this.incidenteForm.getRawValue();

    if (!usuario || !formValue.vehiculoId) {
      this.presentToast('Error de datos. No se puede registrar el incidente.');
      return;
    }
    
    formData.append('vehiculoId', formValue.vehiculoId);
    formData.append('conductorId', usuario.idUsu.toString());
    formData.append('fecha', formValue.fecha);
    formData.append('tipo', formValue.tipo);
    formData.append('descripcion', formValue.descripcion);

    if (this.fotoFile) {
      formData.append('fotoIncidente', this.fotoFile, this.fotoFile.name);
    }

    this.apiService.registrarIncidente(formData).subscribe({
      next: async () => {
        await this.presentToast('Incidente notificado con éxito.');
        this.navCtrl.navigateRoot('/home-movil');
      },
      error: async (err) => {
        await this.presentToast('Error al notificar el incidente.');
        console.error(err);
      }
    });
  }
  
  async presentToast(message: string) {
    const toast = await this.toastController.create({ message, duration: 3000, position: 'bottom' });
    toast.present();
  }
}