import { Component, OnInit, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  IonicModule,
  LoadingController,
  AlertController,
  ToastController,
  NavController,
  ModalController,
} from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { addIcons } from 'ionicons';
// Importamos los iconos necesarios para el modal
import {
  save,
  arrowBackOutline as ionArrowBackOutline,
  closeOutline,
} from 'ionicons/icons';

// Asegúrate de que ApiService ahora exporta Vehiculo y los tipos relacionados,
// o créalos en un archivo .interface.ts e impórtalos desde allí.
import {
  ApiService,
  EstadoVehiculo,
  TipoCombustibleVehiculo,
} from '../../services/api.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Vehiculo } from 'src/types/components.types';

// Importamos el componente DataTable y sus interfaces
import {
  DataTableComponent,
  Column,
  PageEvent,
} from '../../componentes/data-table/data-table.component';

// Importamos el componente de alerta personalizada
import { AlertaPersonalizadaComponent } from '../../componentes/alerta-personalizada/alerta-personalizada.component';

@Component({
  selector: 'app-vehicle-form',
  templateUrl: './vehicle-form.page.html',
  styleUrls: ['./vehicle-form.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    ReactiveFormsModule,
    DataTableComponent,
    AlertaPersonalizadaComponent,
  ],
})
export class VehicleFormPage implements OnInit {
  @Input() vehicleId?: number;
  @Input() isEditMode: boolean = false;
  @Input() isViewMode: boolean = false;

  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private router = inject(Router); // router no se usaba activamente, pero se mantiene
  private activatedRoute = inject(ActivatedRoute);
  private loadingCtrl = inject(LoadingController);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private navCtrl = inject(NavController);
  private modalCtrl = inject(ModalController);

  vehicleForm!: FormGroup;
  pageTitle = 'Nuevo Vehículo';
  // isLoading e isSubmitted se manejaban en tu código, los mantengo si son útiles para tu lógica de UI
  isLoading = false;
  isSubmitted = false; // Para controlar el envío del formulario
  // Opciones para los selectores
  estadosVehiculoOptions: Array<EstadoVehiculo> = [
    'activo',
    'inactivo',
    'mantenimiento',
    'taller',
  ];
  tiposCombustibleOptions: Array<TipoCombustibleVehiculo | null> = [
    null,
    'gasolina_93',
    'gasolina_95',
    'gasolina_97',
    'diesel',
    'electrico',
  ];
  // Variable para controlar las pestañas
  selectedTab = 'infoBasica';

  // Variables para el DataTable de historial de mantenimiento
  mantenimientos: any[] = [];
  historialColumns: Column[] = [
    { header: 'Fecha', field: 'fecha', sortable: true },
    { header: 'Tipo', field: 'tipo', sortable: true },
    { header: 'Descripción', field: 'descripcion', sortable: false },
    { header: 'Kilometraje', field: 'kilometraje', sortable: true },
    { header: 'Costo', field: 'costo', sortable: true },
  ];
  constructor() {
    // Registramos los iconos para que Ionic los reconozca por nombre
    addIcons({ save, 'arrow-back-outline': ionArrowBackOutline, closeOutline });
  }

  ngOnInit() {
    // Support for both modal parameters and route parameters
    if (!this.vehicleId) {
      const idParam = this.activatedRoute.snapshot.paramMap.get('id');
      if (idParam) {
        this.vehicleId = parseInt(idParam, 10);
        this.isEditMode = true;
      }
    }

    this.updatePageTitle();
    this.initForm();

    // Si tenemos un ID de vehículo (ya sea del modal o de la ruta), cargar los datos
    if (this.vehicleId && (this.isEditMode || this.isViewMode)) {
      this.loadVehicleData();
    } else {
      // Cargar historial vacío para vehículos nuevos
      this.cargarHistorialMantenimiento();
    }
  }

  updatePageTitle() {
    if (this.isViewMode) {
      this.pageTitle = 'Ver Vehículo';
    } else if (this.isEditMode) {
      this.pageTitle = 'Editar Vehículo';
    } else {
      this.pageTitle = 'Nuevo Vehículo';
    }
  }
  initForm() {
    // Obtener la fecha actual en formato YYYY-MM-DD para valor por defecto
    const today = new Date().toISOString().split('T')[0];

    this.vehicleForm = this.fb.group({
      // Campos basados en la nueva interfaz Vehiculo (camelCase español)
      // Campos eliminados: name, proyecto
      // Campos renombrados: plate -> patente, status -> estadoVehi, kilometraje -> kmVehi, tipoVehiculo -> tipoVehi
      // Campos nuevos: fecAdqui, tipoCombVehi, kmVidaUtil, efiComb

      patente: [
        '',
        [Validators.required, Validators.pattern(/^[A-Za-z]{4}-[0-9]{2}$/)],
      ], // Formato XXXX-XX con los 2 últimos numéricos
      chasis: [
        '',
        [
          Validators.required,
          Validators.minLength(17),
          Validators.maxLength(17),
        ],
      ], // Ya existía, se mantiene
      marca: ['', Validators.required], // Ya existía, se mantiene (agregamos required)
      modelo: ['', Validators.required], // Ya existía, se mantiene (agregamos required)
      anio: [
        null,
        [
          Validators.required,
          Validators.min(1970),
          Validators.max(new Date().getFullYear()),
        ],
      ], // Actualizado: mínimo 1970, máximo año actual
      kmVehi: [
        0,
        [Validators.required, Validators.min(0), Validators.max(1000000)],
      ], // Máximo 1.000.000 km
      fecAdqui: [today, Validators.required], // Valor por defecto: fecha actual
      estadoVehi: ['activo', Validators.required], // Antes: status

      tipoVehi: ['Camioneta'], // Valor por defecto: 'Camioneta', opciones fijas en el HTML
      tipoCombVehi: [null], // NUEVO OPCIONAL
      kmVidaUtil: [null, [Validators.min(1000), Validators.max(5000000)]], // Entre 1.000 y 5.000.000 km
      efiComb: [null, [Validators.min(2), Validators.max(30)]], // Entre 2 y 30 km/L
      latitud: [null, [Validators.min(-90), Validators.max(90)]], // Ya existía, pero ahora es opcional
      longitud: [null, [Validators.min(-180), Validators.max(180)]], // Ya existía, pero ahora es opcional
    });

    // Deshabilitar formulario en modo solo lectura
    if (this.isViewMode) {
      this.vehicleForm.disable();
    }
  }
  async loadVehicleData() {
    if (!this.vehicleId) return;

    this.isLoading = true;
    const loading = await this.loadingCtrl.create({
      message: 'Cargando datos...',
    });
    await loading.present();

    this.apiService.getVehicle(this.vehicleId).subscribe({
      next: (data: Vehiculo) => {
        // Tipar data como Vehiculo
        this.isLoading = false;
        loading.dismiss();

        let fecAdquiParaForm = data.fecAdqui;
        if (
          fecAdquiParaForm &&
          !(
            typeof fecAdquiParaForm === 'string' &&
            /^\d{4}-\d{2}-\d{2}$/.test(fecAdquiParaForm)
          )
        ) {
          fecAdquiParaForm = new Date(fecAdquiParaForm)
            .toISOString()
            .split('T')[0];
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
          longitud: data.longitud,
        });
        console.log('Datos cargados para edición:', this.vehicleForm.value);
        this.cargarHistorialMantenimiento(this.vehicleId); // Cargar historial al editar
      },
      error: async (err: HttpErrorResponse | Error) => {
        // Tipar err
        this.isLoading = false;
        loading.dismiss();
        console.error('Error cargando datos del vehículo:', err);
        const message =
          err instanceof HttpErrorResponse
            ? err.error?.message || err.message
            : err.message;

        // Reemplazar alert por modal personalizado
        const modal = await this.modalCtrl.create({
          component: AlertaPersonalizadaComponent,
          componentProps: {
            title: 'Error',
            message: `No se pudieron cargar los datos del vehículo. ${message}`,
            icon: 'error',
            buttons: [{ text: 'Aceptar', role: 'confirm' }],
          },
          cssClass: 'custom-alert-modal',
        });
        await modal.present();
        this.closeModal(); // Cerrar modal en caso de error
      },
    });
  }
  // Datos de ejemplo para el historial (en un caso real vendrían de la API)
  cargarHistorialMantenimiento(idVehiculo?: number | null) {
    // Datos de ejemplo - en una aplicación real estos datos vendrían de una API
    if (idVehiculo) {
      this.mantenimientos = [
        {
          id: 1,
          fecha: '2025-05-15',
          tipo: 'Preventivo',
          descripcion: 'Cambio de aceite y filtros',
          kilometraje: 15000,
          costo: 45000,
        },
        {
          id: 2,
          fecha: '2025-04-10',
          tipo: 'Correctivo',
          descripcion: 'Reparación de frenos',
          kilometraje: 14500,
          costo: 85000,
        },
        {
          id: 3,
          fecha: '2025-03-05',
          tipo: 'Preventivo',
          descripcion: 'Rotación de neumáticos',
          kilometraje: 13000,
          costo: 20000,
        },
      ];
    } else {
      this.mantenimientos = []; // Sin historial para vehículos nuevos
    }
  }

  // Métodos para el DataTable
  onHistorialPageChange(event: PageEvent) {
    console.log('Cambio de página en historial:', event);
  }

  onHistorialRowClick(row: any) {
    console.log('Fila de historial seleccionada:', row);
  }

  onHistorialSortColumn(event: { column: string; direction: 'asc' | 'desc' }) {
    console.log('Ordenar historial por:', event);
  }

  onHistorialExport(format: string) {
    console.log('Exportar historial en formato:', format);
  }

  async saveVehicle() {
    this.isSubmitted = true;
    if (this.vehicleForm.invalid) {
      Object.values(this.vehicleForm.controls).forEach((control) => {
        control.markAsTouched(); // Marcar todos para mostrar errores de validación
      });
      this.presentToast(
        'Por favor, completa los campos requeridos correctamente.',
        'warning'
      );
      return;
    }

    // Si es edición, mostrar confirmación personalizada
    if (this.isEditMode) {
      const confirmModal = await this.modalCtrl.create({
        component: AlertaPersonalizadaComponent,
        componentProps: {
          title: 'Confirmar Edición',
          message: `¿Estás seguro de editar el vehículo <strong>${this.vehicleForm.value.patente}</strong>?`,
          icon: 'help',
          buttons: [
            { text: 'Cancelar', role: 'cancel', cssClass: 'button-cancel' },
            { text: 'Actualizar', role: 'confirm', cssClass: 'confirm-button' },
          ],
        },
        backdropDismiss: false,
        cssClass: 'custom-alert-modal',
      });
      await confirmModal.present();
      const { data } = await confirmModal.onDidDismiss();
      if (data !== 'confirm') return;
    }
    // Si es creación, mostrar confirmación personalizada
    else {
      const confirmModal = await this.modalCtrl.create({
        component: AlertaPersonalizadaComponent,
        componentProps: {
          title: 'Confirmar Creación',
          message: `¿Estás seguro de crear el vehículo con patente <strong>${this.vehicleForm.value.patente}</strong>?`,
          icon: 'info',
          buttons: [
            { text: 'Cancelar', role: 'cancel', cssClass: 'button-cancel' },
            { text: 'Crear', role: 'confirm', cssClass: 'confirm-button' },
          ],
        },
        backdropDismiss: false,
        cssClass: 'custom-alert-modal',
      });
      await confirmModal.present();
      const { data } = await confirmModal.onDidDismiss();
      if (data !== 'confirm') return;
    }

    const loading = await this.loadingCtrl.create({
      message: this.isEditMode
        ? 'Actualizando Vehículo...'
        : 'Creando Vehículo...',
    });
    await loading.present();

    // this.vehicleForm.value ya tiene las claves en camelCase español
    const vehicleDataFromForm = this.vehicleForm.value;

    // Construir el objeto Vehiculo para enviar, asegurando tipos correctos
    const vehicleDataToSend: any = {
      // Empezamos con any para flexibilidad y luego asignamos a Vehiculo
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
      kmVidaUtil:
        vehicleDataFromForm.kmVidaUtil !== null &&
        vehicleDataFromForm.kmVidaUtil !== ''
          ? Number(vehicleDataFromForm.kmVidaUtil)
          : null,
      efiComb:
        vehicleDataFromForm.efiComb !== null &&
        vehicleDataFromForm.efiComb !== ''
          ? Number(vehicleDataFromForm.efiComb)
          : null,
      latitud:
        vehicleDataFromForm.latitud !== null &&
        vehicleDataFromForm.latitud !== ''
          ? Number(vehicleDataFromForm.latitud)
          : null,
      longitud:
        vehicleDataFromForm.longitud !== null &&
        vehicleDataFromForm.longitud !== ''
          ? Number(vehicleDataFromForm.longitud)
          : null,
    };
    // Si es edición, incluimos el idVehi (aunque no esté en el form directamente)
    // El ApiService espera el ID como parámetro separado para updateVehicle,
    // y no necesita idVehi en el payload para createVehicle.

    const saveObservable =
      this.isEditMode && this.vehicleId !== undefined
        ? this.apiService.updateVehicle(
            this.vehicleId,
            vehicleDataToSend as Partial<Vehiculo>
          )
        : this.apiService.createVehicle(vehicleDataToSend as Vehiculo);

    saveObservable.subscribe({
      next: async (savedVehicle: Vehiculo) => {
        await loading.dismiss();
        await this.presentToast(
          `Vehículo ${
            this.isEditMode ? 'actualizado' : 'creado'
          } exitosamente.`,
          'success'
        );
        this.closeModal(savedVehicle);
      },
      error: async (error: HttpErrorResponse | Error) => {
        await loading.dismiss();
        console.error('Error guardando vehículo:', error);
        const message =
          error instanceof HttpErrorResponse
            ? error.error?.message || error.message
            : error.message;

        // Reemplazar alert por modal personalizado
        const modal = await this.modalCtrl.create({
          component: AlertaPersonalizadaComponent,
          componentProps: {
            title: 'Error al Guardar',
            message: `No se pudo guardar el vehículo. ${message}`,
            icon: 'error',
            buttons: [{ text: 'Aceptar', role: 'confirm' }],
          },
          cssClass: 'custom-alert-modal',
        });
        await modal.present();
      },
    });
  }

  async presentAlert(header: string, message: string) {
    // Reemplazar alert por modal personalizado
    const modal = await this.modalCtrl.create({
      component: AlertaPersonalizadaComponent,
      componentProps: {
        title: header,
        message: message,
        icon: 'info',
        buttons: [{ text: 'Aceptar', role: 'confirm' }],
      },
      cssClass: 'custom-alert-modal',
    });
    await modal.present();
  }

  async presentToast(
    message: string,
    color: 'success' | 'warning' | 'danger' | 'medium' = 'medium'
  ) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      position: 'bottom',
      color,
    });
    toast.present();
  }

  async closeModal(data?: any) {
    await this.modalCtrl.dismiss(data);
  }
  // Helper para acceder a los controles del formulario en la plantilla para mostrar errores
  get f() {
    return this.vehicleForm.controls;
  }

  // Getter para el año máximo válido
  get maxValidYear() {
    return new Date().getFullYear() + 5;
  }

  // Método para cambiar entre pestañas
  segmentChanged(event: any) {
    this.selectedTab = event.detail.value;
  }
}
