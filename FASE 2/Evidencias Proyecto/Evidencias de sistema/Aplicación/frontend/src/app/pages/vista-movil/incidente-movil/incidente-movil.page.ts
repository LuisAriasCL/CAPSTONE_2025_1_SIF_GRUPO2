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
  providers: [DatePipe] // Necesario para el pipe 'date'
})
export class IncidenteMovilPage implements OnInit {
  incidenteForm: FormGroup;
  selectedIncidenteFileName?: string;

  constructor(
    private fb: FormBuilder,
    private location: Location,
    public platform: Platform,
    private datePipe: DatePipe // <-- Inyectamos DatePipe para usarlo en el TS
  ) {
    addIcons({
      warning: warningOutline,
      camera: cameraOutline,
      'arrow-back': arrowBackOutline
    });

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

  // MÉTODO NUEVO: Para manejar el cambio de fecha
  handleDateChange(event: any) {
    const dateValue = event.detail.value;
    // Usamos el DatePipe inyectado para formatear el valor
    const formattedDate = this.datePipe.transform(dateValue, 'dd/MM/yyyy');
    // Asignamos el valor formateado al control del formulario
    this.incidenteForm.controls['fecha'].setValue(formattedDate);
  }

  // MÉTODO NUEVO: Para manejar el cambio de hora
  handleTimeChange(event: any) {
    const timeValue = event.detail.value;
    const formattedTime = this.datePipe.transform(timeValue, 'HH:mm');
    this.incidenteForm.controls['hora'].setValue(formattedTime);
  }

  onIncidenteFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedIncidenteFileName = file.name;
    }
  }

  registrarIncidente(): void {
    if (this.incidenteForm.valid) {
      console.log('Formulario Incidente Válido:', this.incidenteForm.value);
    } else {
      console.log('Formulario de incidente inválido');
      this.incidenteForm.markAllAsTouched();
    }
  }

  volver(): void {
    this.location.back();
  }
}