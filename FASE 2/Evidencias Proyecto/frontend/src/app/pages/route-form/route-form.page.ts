import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, inject, ChangeDetectorRef } from '@angular/core'; // Añadimos AfterViewInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef
import { CommonModule } from '@angular/common';
// Importamos ReactiveFormsModule para FormGroup
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
// Imports de Ionic y Angular Router
import { IonicModule, LoadingController, AlertController, ToastController, NavController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import * as L from 'leaflet'; // Importamos Leaflet

// Importar Servicios y la interfaz Route (Route se usa indirectamente)
import { ApiService, Route } from '../../services/api.service';
// NO importamos SharedHeaderComponent aquí, asumiendo que lo manejas globalmente
import { addIcons } from 'ionicons';
// Añadimos iconos nuevos para el mapa y botones
import { save, navigateCircleOutline, locationOutline, calculatorOutline, trashOutline, closeCircleOutline } from 'ionicons/icons';

// Ya NO necesitamos el validador jsonPointsValidator

@Component({
  selector: 'app-route-form', // Tu selector
  templateUrl: './route-form.page.html', // Tu template HTML (¡debe tener el div #routeMap!)
  styleUrls: ['./route-form.page.scss'], // Tus estilos
  standalone: true,
  imports: [
      IonicModule,
      CommonModule,
      ReactiveFormsModule // <--- Asegúrate que esté aquí
      // No incluimos SharedHeaderComponent
    ]
})
export class RouteFormPage implements OnInit, AfterViewInit, OnDestroy { // Añadimos interfaces

  // --- Inyecciones ---
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private loadingCtrl = inject(LoadingController);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private navCtrl = inject(NavController);
  private changeDetectorRef = inject(ChangeDetectorRef); // <--- Añadido para forzar detección

  // --- Propiedades del formulario y estado ---
  routeForm!: FormGroup;
  isEditMode = false;
  routeId: number | null = null;
  pageTitle = 'Nueva Ruta';
  isLoading = false; // Para cargar datos
  isSubmitted = false;

  // --- NUEVAS Propiedades para el Mapa Interactivo ---
  @ViewChild('routeMap') routeMapRef!: ElementRef<HTMLDivElement>;
  private routeMap!: L.Map;
  private origenMarker: L.Marker | null = null;
  private destinoMarker: L.Marker | null = null;
  public origenCoords: L.LatLngTuple | null = null;
  public destinoCoords: L.LatLngTuple | null = null;
  private routePolyline: L.Polyline | null = null;
  public calculatedPoints: L.LatLngTuple[] | null = null; // Array [lat, lon]
  public isCalculatingRoute = false;
  public routeCalculationError: string | null = null;
  // --- FIN NUEVAS Propiedades ---

  constructor() {
    addIcons({ save, navigateCircleOutline, locationOutline, calculatorOutline, trashOutline, closeCircleOutline });
  }

  ngOnInit() {
    // Inicializar formulario SIN el campo 'puntos'
    this.routeForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
    });

    // Modo Edición?
    const idParam = this.activatedRoute.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.routeId = parseInt(idParam, 10);
      this.pageTitle = 'Editar Ruta';
      this.loadRouteData();
    }
  }

  // --- Hook AfterViewInit para inicializar mapa ---
  ngAfterViewInit(): void {
    setTimeout(() => this.initializeRouteMap(), 150); // Pequeño delay
  }

  // --- Hook OnDestroy para limpiar mapa ---
  ngOnDestroy(): void {
    if (this.routeMap) {
      this.routeMap.off('click');
      this.routeMap.remove();
      console.log("Mapa del formulario eliminado.");
    }
  }

  // --- Inicializar Mapa del Formulario ---
  private initializeRouteMap(): void {
    if (this.routeMap || !this.routeMapRef?.nativeElement) return;
    const mapContainer = this.routeMapRef.nativeElement;
    const initialCoords: L.LatLngTuple = (this.isEditMode && this.calculatedPoints?.length) ? this.calculatedPoints[0] : [-35.846, -71.597]; // Linares o primer punto
    const initialZoom = this.isEditMode && this.calculatedPoints?.length ? 14 : 13;

    try {
      this.routeMap = L.map(mapContainer, { center: initialCoords, zoom: initialZoom });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM' }).addTo(this.routeMap);
      this.routeMap.on('click', (e: L.LeafletMouseEvent) => this.handleMapClick(e.latlng));
      console.log("Mapa del formulario listo.");
      setTimeout(() => this.routeMap?.invalidateSize(), 200);

      // Si estamos editando y los puntos ya cargaron, mostrarlos
      if (this.isEditMode && this.calculatedPoints) {
          this.displayLoadedRouteOnMap();
      }
    } catch (error) { console.error("Error inicializando mapa del formulario:", error); }
  }

   // --- Mostrar ruta y marcadores (en modo edición) ---
  private displayLoadedRouteOnMap(): void {
    if (!this.routeMap || !this.calculatedPoints || this.calculatedPoints.length < 1) return;
    console.log("Mostrando ruta y marcadores de edición en mapa...");
    this.clearMapSelection();

    this.origenCoords = this.calculatedPoints[0];
    this.origenMarker = L.marker(this.origenCoords, { draggable: true, title: "Origen" })
        .addTo(this.routeMap).on('dragend', (e) => this.handleMarkerDragEnd(e, 'origen'));

    if (this.calculatedPoints.length >= 2) {
        this.destinoCoords = this.calculatedPoints[this.calculatedPoints.length - 1];
        this.destinoMarker = L.marker(this.destinoCoords, { draggable: true, title: "Destino" })
            .addTo(this.routeMap).on('dragend', (e) => this.handleMarkerDragEnd(e, 'destino'));
        this.routePolyline = L.polyline(this.calculatedPoints, { color: 'blue' }).addTo(this.routeMap);
        setTimeout(() => {
            if (this.routePolyline) this.routeMap.fitBounds(this.routePolyline.getBounds().pad(0.1));
        }, 300);
    } else {
        this.routeMap.setView(this.origenCoords, 15);
    }
  }

  // --- Manejar Clics en Mapa ---
  private handleMapClick(latlng: L.LatLng): void {
    const coords: L.LatLngTuple = [latlng.lat, latlng.lng];
    this.clearCalculatedRoute(); // Limpiar ruta calculada si se cambian puntos

    if (!this.origenMarker) {
      this.origenCoords = coords;
      this.origenMarker = L.marker(coords, { draggable: true, title: "Origen" })
        .addTo(this.routeMap).on('dragend', (e) => this.handleMarkerDragEnd(e, 'origen'));
    } else if (!this.destinoMarker) {
      this.destinoCoords = coords;
      this.destinoMarker = L.marker(coords, { draggable: true, title: "Destino" })
        .addTo(this.routeMap).on('dragend', (e) => this.handleMarkerDragEnd(e, 'destino'));
    } else { // Reiniciar
      this.origenCoords = coords;
      if (this.origenMarker) this.origenMarker.setLatLng(coords);
      if (this.destinoMarker) { this.routeMap.removeLayer(this.destinoMarker); this.destinoMarker = null; this.destinoCoords = null; }
    }
     // Forzar detección de cambios para actualizar UI que muestra coords
     this.changeDetectorRef.detectChanges();
  }

  // --- Actualizar Coordenadas al Arrastrar ---
  private handleMarkerDragEnd(event: L.DragEndEvent, type: 'origen' | 'destino'): void {
    const newCoords: L.LatLngTuple = [event.target.getLatLng().lat, event.target.getLatLng().lng];
    if (type === 'origen') this.origenCoords = newCoords;
    else this.destinoCoords = newCoords;
    this.clearCalculatedRoute();
    this.changeDetectorRef.detectChanges(); // Forzar detección
  }

  // --- Limpiar Selección Mapa ---
  clearMapSelection(): void {
    this.clearCalculatedRoute();
    if (this.origenMarker) { this.routeMap.removeLayer(this.origenMarker); this.origenMarker = null; this.origenCoords = null; }
    if (this.destinoMarker) { this.routeMap.removeLayer(this.destinoMarker); this.destinoMarker = null; this.destinoCoords = null; }
    this.changeDetectorRef.detectChanges(); // Forzar detección
  }

  // --- Limpiar Ruta Calculada ---
  clearCalculatedRoute(): void {
    if (this.routePolyline) { this.routeMap.removeLayer(this.routePolyline); this.routePolyline = null; }
    this.calculatedPoints = null;
    this.routeCalculationError = null;
    // No forzamos detectChanges aquí, se hará al seleccionar puntos o calcular
  }

  // --- Cargar Datos para Editar ---
  async loadRouteData() {
    // ... (código igual que en respuesta #143) ...
     if (!this.routeId) return;
    this.isLoading = true;
    const loading = await this.loadingCtrl.create({ message: 'Cargando datos...' });
    await loading.present();
    this.apiService.getRoute(this.routeId).subscribe({
      next: (data) => {
        loading.dismiss();
        this.isLoading = false;
        this.routeForm.patchValue({ nombre: data.nombre, descripcion: data.descripcion });
        if (Array.isArray(data.puntos)) {
             this.calculatedPoints = data.puntos as L.LatLngTuple[];
             if (this.routeMap) { // Si mapa ya está listo, mostrar
                 this.displayLoadedRouteOnMap();
             }
        } else {
             console.error("Los puntos recibidos de la API no son un array válido:", data.puntos);
             this.presentToast('Error: Los datos de puntos de la ruta guardada son inválidos.', 'danger');
             this.calculatedPoints = null;
        }
      },
      error: async (err) => { /* ... como estaba ... */ }
    });
  }

  // --- Calcular Ruta con OSRM ---
  async calculateRoute() {
    if (!this.origenCoords || !this.destinoCoords) {
      this.presentToast("Marca Origen y Destino en el mapa.", "warning"); return;
    }
    this.isCalculatingRoute = true;
    this.routeCalculationError = null;
    const loading = await this.loadingCtrl.create({ message: 'Calculando ruta...' });
    await loading.present();

    this.apiService.getRoutePath(this.origenCoords!, this.destinoCoords!).subscribe({
      next: async (points) => {
        await loading.dismiss();
        this.isCalculatingRoute = false;
        if (points && points.length > 1) {
          this.calculatedPoints = points; // GUARDAR PUNTOS
          // Limpiar SÓLO la polilínea anterior, no los marcadores ni calculatedPoints
          if (this.routePolyline) { this.routeMap.removeLayer(this.routePolyline); }
          this.routePolyline = L.polyline(points, { color: 'blue' }).addTo(this.routeMap); // Dibujar nueva
          this.routeMap.fitBounds(this.routePolyline.getBounds().pad(0.1)); // Ajustar zoom
          this.presentToast("Ruta calculada.", "success");
        } else {
          this.calculatedPoints = null; // Falló, quitar puntos
          this.routeCalculationError = 'No se pudo calcular una ruta válida.';
          this.presentToast(this.routeCalculationError, "danger");
        }
        this.changeDetectorRef.detectChanges(); // <-- Forzar detección aquí para actualizar estado botón Guardar
      },
      error: async (error) => {
        await loading.dismiss();
        this.isCalculatingRoute = false;
        this.calculatedPoints = null; // Falló, quitar puntos
        this.routeCalculationError = 'Error al conectar con servicio de rutas.';
        console.error("Error cálculo OSRM:", error);
        this.presentToast(this.routeCalculationError, "danger");
        this.changeDetectorRef.detectChanges(); // <-- Forzar detección aquí también
      }
    });
  }

  // --- Guardar Ruta (usa calculatedPoints) ---
  async saveRoute() {
     this.isSubmitted = true; // Marcar como intento de envío
    // Validar nombre Y que calculatedPoints exista y tenga puntos
    if (this.routeForm.invalid || !this.calculatedPoints || this.calculatedPoints.length === 0) {
       this.presentToast('Asigna un nombre y calcula una ruta válida.', 'warning'); return;
    }
    const loading = await this.loadingCtrl.create({ message: this.isEditMode ? 'Actualizando...' : 'Creando...' });
    await loading.present();
    try {
        // Mapear por seguridad para asegurar formato [lat, lon]
        const puntosParaGuardar: Array<[number, number]> = this.calculatedPoints.map(p => [p[0], p[1]]);
        const routeData = {
            nombre: this.routeForm.value.nombre,
            descripcion: this.routeForm.value.descripcion,
            puntos: puntosParaGuardar
        };
        const saveObservable = this.isEditMode
            ? this.apiService.updateRoute(this.routeId!, routeData)
            : this.apiService.createRoute(routeData);
        saveObservable.subscribe({
            next: async (savedRoute) => {
                await this.presentToast(`Ruta ${this.isEditMode ? 'actualizada' : 'creada'}.`, 'success');
                this.navCtrl.navigateBack('/rutas');
            },
            error: async (error) => {
                console.error("Error guardando ruta:", error);
                await this.presentAlert('Error al Guardar', `No se pudo guardar la ruta. ${error.message || 'Error desconocido.'}`);
            },
            complete: async () => { if (loading) await loading.dismiss(); } // Asegurar dismiss
        });
    } catch (error) {
        if (loading) await loading.dismiss(); // Asegurar dismiss
        console.error("Error inesperado en saveRoute:", error);
        await this.presentAlert('Error', 'Ocurrió un error inesperado al guardar.');
    }
  }

  // --- Helpers (como estaban) ---
  async presentAlert(header: string, message: string) { /* ... */ }
  async presentToast(message: string, color: 'success'|'warning'|'danger'|'medium' = 'medium') { /* ... */ }

} // Fin de la clase