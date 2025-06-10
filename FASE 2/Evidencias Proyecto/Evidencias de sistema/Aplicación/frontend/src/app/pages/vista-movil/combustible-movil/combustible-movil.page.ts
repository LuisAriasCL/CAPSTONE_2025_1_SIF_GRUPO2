import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ActionSheetController, Platform } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
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
  imageSrc: string | null = null;
  isImageLoading = false;
  constructor(
    private fb: FormBuilder,
    private location: Location,
    private actionSheetCtrl: ActionSheetController,
    private platform: Platform
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

  async presentPhotoOptions() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Seleccionar foto',
      cssClass: 'custom-action-sheet',
      buttons: [
        {
          text: 'Tomar foto',
          icon: 'camera',
          handler: () => {
            this.takePicture();
          }
        },
        {
          text: 'Seleccionar de galería',
          icon: 'image',
          handler: () => {
            this.pickImage();
          }
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }
  async takePicture() {
    // Si estamos en desktop, usamos un input file
    if (this.platform.is('desktop')) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment'; // Intenta usar la cámara en dispositivos que lo soporten
      
      input.onchange = async (event: any) => {
        const file = event.target.files[0];
        if (file) {
          try {
            await this.processImage(file);
            console.log('Foto simulada tomada');
          } catch (error) {
            console.error('Error al procesar la imagen:', error);
          }
        }
      };
      
      input.click();
    } else {
      try {
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Uri,
          source: CameraSource.Camera
        });
        
        const fileName = new Date().getTime() + '.jpeg';
        this.selectedFileName = 'Foto_' + fileName;
        this.imageSrc = image.webPath || null;

        if (image.webPath) {
          console.log('Foto tomada:', image.webPath);
        }
      } catch (error) {
        console.error('Error al tomar la foto:', error);
      }
    }
  }

  async pickImage() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos
      });

      if (image.webPath) {
        const fileName = image.webPath.split('/').pop() || 'selected-image.jpeg';
        this.selectedFileName = fileName;
        this.imageSrc = image.webPath;
        console.log('Imagen seleccionada:', image.webPath);
      }
    } catch (error) {
      console.error('Error al seleccionar la imagen:', error);
      // Si estamos en desktop y falla, usamos el input file como fallback
      if (this.platform.is('desktop')) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = async (event: any) => {
          const file = event.target.files[0];
          if (file) {
            try {
              await this.processImage(file);
              console.log('Imagen seleccionada (fallback)');
            } catch (error) {
              console.error('Error al procesar la imagen:', error);
            }
          }
        };
        
        input.click();
      }
    }
  }

  private async processImage(file: File): Promise<void> {
    this.isImageLoading = true;
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imageSrc = e.target.result;
        this.selectedFileName = file.name;
        this.isImageLoading = false;
        resolve();
      };
      reader.onerror = () => {
        this.isImageLoading = false;
        reject(new Error('Error al leer el archivo'));
      };
      reader.readAsDataURL(file);
    });
  }
}