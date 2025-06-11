import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { IonicModule, Platform } from '@ionic/angular';
import { CommonModule, DatePipe } from '@angular/common';

// Importación de íconos para esta página
import { addIcons } from 'ionicons';
import { warningOutline, cameraOutline, arrowBackOutline } from 'ionicons/icons';

@Component({
  selector: 'app-incidente-movil',
  templateUrl: './incidente-movil.page.html',
  styleUrls: ['./incidente-movil.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    ReactiveFormsModule
  ],
  providers: [DatePipe] // Necesario para el pipe 'date' que usa ion-datetime
})
export class IncidenteMovilPage implements OnInit {
  incidenteForm: FormGroup;
  selectedIncidenteFileName?: string;

  constructor(
    private fb: FormBuilder,
    private location: Location,
    public platform: Platform
  ) {
    // Registra los íconos que se usarán en esta página
    addIcons({
      warning: warningOutline,
      camera: cameraOutline,
      'arrow-back': arrowBackOutline // Para el botón de atrás si no usas ion-back-button
    });

    // Inicializa el formulario con sus campos y validaciones
    this.incidenteForm = this.fb.group({
      vehiculo: ['', Validators.required],
      conductor: ['', Validators.required],
      fecha: ['', Validators.required],
      hora: ['', Validators.required],
      tipoIncidente: ['', Validators.required],
      descripcion: ['', Validators.required],
    });
  }

  ngOnInit(): void {
  }

  // Método para manejar la selección de un archivo
  onIncidenteFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedIncidenteFileName = file.name;
      // Aquí agregarías la lógica para manejar el archivo,
      // por ejemplo, guardándolo en una variable para subirlo después.
    }
  }

  // Método que se llama al presionar el botón de registrar
  registrarIncidente(): void {
    if (this.incidenteForm.valid) {
      console.log('Formulario Incidente Válido:', this.incidenteForm.value);
      // Aquí llamarías a tu servicio para guardar los datos en el backend
      // ej: this.incidenteService.registrar(this.incidenteForm.value).subscribe(...);
    } else {
      console.log('Formulario de incidente inválido');
      // Marcar todos los campos como "tocados" para que se muestren los errores de validación
      this.incidenteForm.markAllAsTouched();
    }
  }

  // Método para el botón de volver atrás
  volver(): void {
    this.location.back();
  }
}