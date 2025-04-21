import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
// Imports necesarios para formularios reactivos y validadores
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
// Imports de Ionic y Angular Router
import { IonicModule, LoadingController, AlertController, ToastController, NavController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router'; // ActivatedRoute para leer parámetros de URL

// Importar Servicios y Componentes
import { ApiService, Route } from '../../services/api.service';

import { addIcons } from 'ionicons';
import { save } from 'ionicons/icons'; // Icono para el botón

// --- Validador Custom para los Puntos JSON ---
function jsonPointsValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null; // Dejar que 'required' maneje el caso vacío
  }
  try {
    const parsed = JSON.parse(control.value);
    if (!Array.isArray(parsed)) {
      return { notAnArray: true }; // No es un array
    }
    if (parsed.length === 0) {
      return { isEmptyArray: true }; // Array vacío
    }
    for (const point of parsed) {
      if (!Array.isArray(point) || point.length !== 2 || typeof point[0] !== 'number' || typeof point[1] !== 'number') {
        return { invalidPointFormat: true }; // Formato de punto incorrecto
      }
    }
    return null; // ¡Todo OK!
  } catch (e) {
    return { invalidJson: true }; // Error al parsear JSON
  }
}
// --- Fin Validador ---

@Component({
  selector: 'app-route-form',
  templateUrl: './route-form.page.html',
  styleUrls: ['./route-form.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule] // Imports necesarios
})
export class RouteFormPage implements OnInit {

  // Inyecciones
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private loadingCtrl = inject(LoadingController);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private navCtrl = inject(NavController); // Para volver atrás fácilmente

  // Propiedades del componente
  routeForm!: FormGroup;
  isEditMode = false;
  routeId: number | null = null;
  pageTitle = 'Nueva Ruta';
  isLoading = false;
  isSubmitted = false;

  constructor() {
     addIcons({ save }); // Registrar icono
   }

  ngOnInit() {
    // Inicializar formulario
    this.routeForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''], // Opcional
      // Usamos el validador custom para puntos
      puntos: ['', [Validators.required, jsonPointsValidator]]
    });

    // Comprobar si estamos en modo edición (leyendo el ID de la URL)
    const idParam = this.activatedRoute.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.routeId = parseInt(idParam, 10);
      this.pageTitle = 'Editar Ruta';
      this.loadRouteData(); // Cargar datos si estamos editando
    }
  }

  // Cargar datos de la ruta si estamos editando
  async loadRouteData() {
    if (!this.routeId) return;

    this.isLoading = true;
    const loading = await this.loadingCtrl.create({ message: 'Cargando datos...' });
    await loading.present();

    this.apiService.getRoute(this.routeId).subscribe({
      next: (data) => {
         this.isLoading = false;
         loading.dismiss();
         // Llenar el formulario con los datos. ¡Puntos necesita stringify!
         this.routeForm.patchValue({
           nombre: data.nombre,
           descripcion: data.descripcion,
           // Convertir el array de puntos a string JSON formateado para el textarea
           puntos: JSON.stringify(data.puntos, null, 2) // El '2' añade indentación
         });
      },
      error: async (err) => {
        this.isLoading = false;
        loading.dismiss();
        console.error("Error cargando datos de ruta:", err);
        await this.presentAlert('Error', 'No se pudieron cargar los datos de la ruta.');
        this.navCtrl.back(); // Volver a la lista si hay error
      }
    });
  }

  // Guardar (Crear o Actualizar)
  async saveRoute() {
    this.isSubmitted = true;
    if (this.routeForm.invalid) {
        console.warn('Formulario inválido');
         this.presentToast('Por favor, revisa los campos del formulario.', 'warning');
        return;
    }

    const loading = await this.loadingCtrl.create({ message: this.isEditMode ? 'Actualizando...' : 'Creando...' });
    await loading.present();

    let puntosArray: Array<[number, number]>;
    try {
        // Parsear el string JSON del textarea a un array real
        puntosArray = JSON.parse(this.routeForm.value.puntos);
    } catch (e) {
        await loading.dismiss();
        await this.presentAlert('Error de Formato', 'El formato JSON de los puntos no es válido.');
        return;
    }

    // Datos a enviar a la API
    const routeData: Partial<Route> = {
        nombre: this.routeForm.value.nombre,
        descripcion: this.routeForm.value.descripcion,
        puntos: puntosArray // Enviar el array parseado
    };

    // Determinar si llamar a create o update
    const saveObservable = this.isEditMode
        ? this.apiService.updateRoute(this.routeId!, routeData) // ! asegura a TS que routeId no es null aquí
        : this.apiService.createRoute(routeData);

    saveObservable.subscribe({
        next: async (savedRoute) => {
            await loading.dismiss();
            await this.presentToast(`Ruta ${this.isEditMode ? 'actualizada' : 'creada'} exitosamente.`, 'success');
            // this.router.navigateByUrl('/rutas'); // O usar NavController
            this.navCtrl.navigateBack('/rutas'); // Volver a la lista
        },
        error: async (error) => {
            await loading.dismiss();
            console.error("Error guardando ruta:", error);
            await this.presentAlert('Error al Guardar', `No se pudo guardar la ruta. ${error.message}`);
        }
    });
  }


  // --- Helpers para Alertas y Toasts ---
   async presentAlert(header: string, message: string) {
     const alert = await this.alertCtrl.create({ header, message, buttons: ['OK'] });
     await alert.present();
   }

    async presentToast(message: string, color: 'success' | 'warning' | 'danger' | 'medium' = 'medium') {
       const toast = await this.toastCtrl.create({ message, duration: 2500, position: 'bottom', color });
       toast.present();
    }

} // Fin de la clase