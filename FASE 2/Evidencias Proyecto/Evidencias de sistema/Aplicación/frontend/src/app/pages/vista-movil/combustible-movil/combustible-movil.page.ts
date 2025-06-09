import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
// import { FlexLayoutModule } from '@angular/flex-layout';

import { addIcons } from 'ionicons';
import { colorPaletteOutline, cameraOutline, arrowBackOutline } from 'ionicons/icons'; // Asegúrate de incluir arrowBackOutline si lo usas manualmente

@Component({
  selector: 'app-combustible-movil',
  templateUrl: './combustible-movil.page.html',
  styleUrls: ['./combustible-movil.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    ReactiveFormsModule
    // FlexLayoutModule
  ]
})
export class CombustibleMovilPage implements OnInit {
  combustibleForm: FormGroup;
  selectedFileName?: string;

  constructor(
    private fb: FormBuilder,
    private location: Location
  ) {
    addIcons({
      'color-palette': colorPaletteOutline,
      camera: cameraOutline,
      'arrow-back': arrowBackOutline // Para el botón de atrás si no usas ion-back-button
    });

    this.combustibleForm = this.fb.group({
      vehiculo: ['', Validators.required],
      conductor: ['', Validators.required],
      odometro: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      tipoCombustible: ['', Validators.required],
      cantidadLitros: ['', [Validators.required, Validators.pattern('^[0-9]+(\\.[0-9]{1,2})?$')]],
    });
  }

  ngOnInit(): void {
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFileName = file.name;
      // Lógica para manejar el archivo...
    }
  }

  guardarCargaCombustible(): void {
    if (this.combustibleForm.valid) {
      console.log('Formulario Combustible:', this.combustibleForm.value);
      // Lógica para enviar datos...
    } else {
      this.combustibleForm.markAllAsTouched();
    }
  }

  volver(): void {
    this.location.back();
  }
}