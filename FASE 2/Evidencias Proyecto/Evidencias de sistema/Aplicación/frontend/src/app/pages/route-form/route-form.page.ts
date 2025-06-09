// src/app/pages/route-form/route-form.page.ts

import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, inject, ChangeDetectorRef, Input } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common'; // <--- ASEGÚRATE DE IMPORTAR DecimalPipe
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, LoadingController, AlertController, ToastController, NavController, ModalController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import * as L from 'leaflet';
// Importa OsrmRouteData y asegúrate que la interfaz Route incluya kilometrosRuta
import { ApiService, Route, OsrmRouteData } from '../../services/api.service'; // <--- OsrmRouteData AÑADIDO
import { addIcons } from 'ionicons';
// Añade el icono para la distancia, por ejemplo, speedometerOutline
import { save, navigateCircleOutline, locationOutline, calculatorOutline, trashOutline, closeCircleOutline, speedometerOutline, close } from 'ionicons/icons'; // <--- close AÑADIDO

@Component({
  selector: 'app-route-form',
  templateUrl: './route-form.page.html',
  styleUrls: ['./route-form.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    ReactiveFormsModule,
    DecimalPipe // <--- DecimalPipe AÑADIDO AQUÍ
  ]
})
export class RouteFormPage implements OnInit, AfterViewInit, OnDestroy {

  // --- Inyecciones ---
  private fb = inject(FormBuilder);
    private apiService = inject(ApiService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private loadingCtrl = inject(LoadingController);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private navCtrl = inject(NavController);
  private changeDetectorRef = inject(ChangeDetectorRef);
  private modalCtrl = inject(ModalController);
  // --- Propiedades del formulario y estado ---
  @Input() routeId: number | null = null; // Para recibir ID desde modal
  @Input() isEditMode: boolean = false;   // Para recibir modo desde modal
  routeForm!: FormGroup;
  pageTitle = 'Nueva Ruta';
  isLoading = false;
  isSubmitted = false;

  // --- Propiedades para el Mapa Interactivo ---
  @ViewChild('routeMap') routeMapRef!: ElementRef<HTMLDivElement>;
  private routeMap!: L.Map;
  private origenMarker: L.Marker | null = null;
  private destinoMarker: L.Marker | null = null;
  public origenCoords: L.LatLngTuple | null = null;
  public destinoCoords: L.LatLngTuple | null = null;
  private routePolyline: L.Polyline | null = null;
  public calculatedPoints: L.LatLngTuple[] | null = null;
  public isCalculatingRoute = false;
  public routeCalculationError: string | null = null;

  // --- NUEVAS Propiedades para Distancia y Duración ---
  public calculatedDistance: number | null = null; // En KM
  public calculatedDuration: number | null = null; // En segundos (opcional para mostrar)
  constructor() {
    addIcons({
      save, navigateCircleOutline, locationOutline, calculatorOutline, trashOutline, closeCircleOutline,
      speedometerOutline, close // <--- Icono close añadido
    });
  }
  ngOnInit() {
    this.routeForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
    });

    // Verificar si se recibieron parámetros via modal (Input properties)
    if (this.routeId && this.isEditMode) {
      this.pageTitle = 'Editar Ruta';
      this.loadRouteData();
    } else {
      // Fallback: verificar parámetros de ruta (para navegación directa)
      const idParam = this.activatedRoute.snapshot.paramMap.get('id');
      if (idParam) {
        this.isEditMode = true;
        this.routeId = parseInt(idParam, 10);
        this.pageTitle = 'Editar Ruta';
        this.loadRouteData();
      }
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initializeRouteMap(), 150);
  }

  ngOnDestroy(): void {
    if (this.routeMap) {
      this.routeMap.off('click');
      this.routeMap.remove();
      console.log("Mapa del formulario eliminado.");
    }
  }

  private initializeRouteMap(): void {
    if (this.routeMap || !this.routeMapRef?.nativeElement) return;
    const mapContainer = this.routeMapRef.nativeElement;
    const initialCoords: L.LatLngTuple = (this.isEditMode && this.calculatedPoints?.length) ? this.calculatedPoints[0] : [-35.846, -71.597];
    const initialZoom = this.isEditMode && this.calculatedPoints?.length ? 14 : 13;

    try {
      this.routeMap = L.map(mapContainer, { center: initialCoords, zoom: initialZoom });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM' }).addTo(this.routeMap);
      this.routeMap.on('click', (e: L.LeafletMouseEvent) => this.handleMapClick(e.latlng));
      console.log("Mapa del formulario listo.");
      setTimeout(() => this.routeMap?.invalidateSize(), 200);

      if (this.isEditMode && this.calculatedPoints) {
          this.displayLoadedRouteOnMap();
      }
    } catch (error) { console.error("Error inicializando mapa del formulario:", error); }
  }

  private displayLoadedRouteOnMap(): void {
    if (!this.routeMap || !this.calculatedPoints || this.calculatedPoints.length < 1) return;
    console.log("Mostrando ruta y marcadores de edición en mapa...");
    this.clearMapSelectionMarkersAndPolyline(); // Limpia solo elementos del mapa, no datos como calculatedDistance

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
    // La distancia (this.calculatedDistance) ya debería estar cargada por loadRouteData si es modo edición
    // y se mostrará en el HTML gracias a *ngIf="calculatedDistance !== null"
  }

   private clearMapSelectionMarkersAndPolyline(): void { // Para limpiar el mapa antes de redibujar una ruta cargada
    if (this.origenMarker) { this.routeMap.removeLayer(this.origenMarker); this.origenMarker = null; }
    if (this.destinoMarker) { this.routeMap.removeLayer(this.destinoMarker); this.destinoMarker = null; }
    if (this.routePolyline) { this.routeMap.removeLayer(this.routePolyline); this.routePolyline = null; }
  }
  private handleMapClick(latlng: L.LatLng): void {
    const coords: L.LatLngTuple = [latlng.lat, latlng.lng];
    this.clearCalculatedRouteAndDistance(); // MODIFICADO: Limpiar ruta y distancia

    if (!this.origenMarker) {
      this.origenCoords = coords;
      this.origenMarker = L.marker(coords, { draggable: true, title: "Origen" })
        .addTo(this.routeMap).on('dragend', (e) => this.handleMarkerDragEnd(e, 'origen'));
    } else if (!this.destinoMarker) {
      this.destinoCoords = coords;
      this.destinoMarker = L.marker(coords, { draggable: true, title: "Destino" })
        .addTo(this.routeMap).on('dragend', (e) => this.handleMarkerDragEnd(e, 'destino'));
      
      // NUEVO: Calcular ruta automáticamente cuando se establece el destino
      this.calculateRouteAutomatically();
    } else { // Reiniciar
      this.origenCoords = coords;
      if (this.origenMarker) this.origenMarker.setLatLng(coords);
      if (this.destinoMarker) { this.routeMap.removeLayer(this.destinoMarker); this.destinoMarker = null; this.destinoCoords = null; }
    }
     this.changeDetectorRef.detectChanges();
  }
  private handleMarkerDragEnd(event: L.DragEndEvent, type: 'origen' | 'destino'): void {
    const newCoords: L.LatLngTuple = [event.target.getLatLng().lat, event.target.getLatLng().lng];
    if (type === 'origen') this.origenCoords = newCoords;
    else this.destinoCoords = newCoords;
    this.clearCalculatedRouteAndDistance(); // MODIFICADO: Limpiar ruta y distancia
    
    // NUEVO: Si ambos puntos están definidos, calcular ruta automáticamente
    if (this.origenCoords && this.destinoCoords) {
      this.calculateRouteAutomatically();
    }
    
    this.changeDetectorRef.detectChanges();
  }

  clearMapSelection(): void {
    this.clearCalculatedRouteAndDistance(); // MODIFICADO
    if (this.origenMarker) { this.routeMap.removeLayer(this.origenMarker); this.origenMarker = null; this.origenCoords = null; }
    if (this.destinoMarker) { this.routeMap.removeLayer(this.destinoMarker); this.destinoMarker = null; this.destinoCoords = null; }
    this.changeDetectorRef.detectChanges();
  }

  // MÉTODO RENOMBRADO Y MODIFICADO
  clearCalculatedRouteAndDistance(): void {
    if (this.routePolyline) { this.routeMap.removeLayer(this.routePolyline); this.routePolyline = null; }
    this.calculatedPoints = null;
    this.routeCalculationError = null;
    this.calculatedDistance = null; // <--- AÑADIDO
    this.calculatedDuration = null; // <--- AÑADIDO
    // No forzamos detectChanges aquí, se hará al seleccionar puntos o calcular
    // o si se llama desde un método que sí lo hace (como clearMapSelection).
  }

  async loadRouteData() {
    if (!this.routeId) return;
    this.isLoading = true;
    const loading = await this.loadingCtrl.create({ message: 'Cargando datos...' });
    await loading.present();
    this.apiService.getRoute(this.routeId).subscribe({
      next: (data: Route) => {
        loading.dismiss();
        this.isLoading = false;
        this.routeForm.patchValue({
          nombre: data.nombreRuta,
          descripcion: data.descripcionRuta
        });

        let puntosDeserializados: any = data.puntosRuta;
        if (typeof data.puntosRuta === 'string') {
          try { puntosDeserializados = JSON.parse(data.puntosRuta); }
          catch (e) { console.error('Error parseando puntosRuta', e); puntosDeserializados = null; }
        }

        if (Array.isArray(puntosDeserializados) && puntosDeserializados.length > 0) {
          this.calculatedPoints = puntosDeserializados as L.LatLngTuple[];
          if (typeof data.kilometrosRuta === 'number') { // <--- CARGAR DISTANCIA GUARDADA
            this.calculatedDistance = data.kilometrosRuta;
          }
          if (this.routeMap) { // Asegurarse que el mapa esté listo
            this.displayLoadedRouteOnMap();
          }
        } else {
          if (puntosDeserializados && puntosDeserializados.length === 0) {
            this.calculatedPoints = [];
          } else {
            console.error("Los puntosRuta recibidos de la API no son un array válido:", data.puntosRuta);
            this.presentToast('Error: Los datos de puntos de la ruta guardada son inválidos.', 'danger');
            this.calculatedPoints = null;
          }
          this.calculatedDistance = null; // Si no hay puntos, no hay distancia guardada relevante
        }
        this.changeDetectorRef.detectChanges(); // Actualizar la UI
      },
      error: async (err) => { /* ... tu manejo de error ... */ }
    });
  }

  // NUEVO: Método para calcular ruta automáticamente
  private async calculateRouteAutomatically() {
    if (!this.origenCoords || !this.destinoCoords) return;
    
    this.isCalculatingRoute = true;
    this.routeCalculationError = null;
    this.calculatedDistance = null;
    this.calculatedDuration = null;

    this.apiService.getRoutePath(this.origenCoords!, this.destinoCoords!).subscribe({
      next: async (osrmResponse: OsrmRouteData | null) => {
        this.isCalculatingRoute = false;
        if (osrmResponse && osrmResponse.points && osrmResponse.points.length > 1) {
          this.calculatedPoints = osrmResponse.points;
          
          if (typeof osrmResponse.distance === 'number') {
            this.calculatedDistance = parseFloat((osrmResponse.distance / 1000).toFixed(2));
          }
          if (typeof osrmResponse.duration === 'number') {
            this.calculatedDuration = osrmResponse.duration;
          }

          if (this.routePolyline) { this.routeMap.removeLayer(this.routePolyline); }
          this.routePolyline = L.polyline(osrmResponse.points, { color: 'blue' }).addTo(this.routeMap);
          this.routeMap.fitBounds(this.routePolyline.getBounds().pad(0.1));          this.presentToast(`Ruta calculada: ${this.calculatedDistance !== null ? this.calculatedDistance + ' km' : ''}`, "success");
            // NUEVO: Solo mostrar mensaje de que la ruta está lista para guardar
          if (this.routeForm.valid && this.routeForm.value.nombre && this.routeForm.value.nombre.trim()) {
            this.presentToast('Ruta lista para crear. Presiona "CREAR RUTA" para guardar.', "medium");
          }
        } else {
          this.calculatedPoints = null;
          this.calculatedDistance = null;
          this.calculatedDuration = null;
          this.routeCalculationError = 'No se pudo calcular una ruta válida desde OSRM.';
          this.presentToast(this.routeCalculationError, "danger");
        }
        this.changeDetectorRef.detectChanges();
      },
      error: async (error) => {
        this.isCalculatingRoute = false;
        this.calculatedPoints = null;
        this.calculatedDistance = null;
        this.calculatedDuration = null;
        this.routeCalculationError = 'Error al conectar con servicio de rutas.';
        console.error("Error cálculo OSRM:", error);
        this.presentToast(this.routeCalculationError, "danger");
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  async calculateRoute() {
    if (!this.origenCoords || !this.destinoCoords) {
      this.presentToast("Marca Origen y Destino en el mapa.", "warning"); return;
    }
    this.isCalculatingRoute = true;
    this.routeCalculationError = null;
    this.calculatedDistance = null; // <--- Resetear distancia
    this.calculatedDuration = null; // <--- Resetear duración

    const loading = await this.loadingCtrl.create({ message: 'Calculando ruta...' });
    await loading.present();

    // Ahora getRoutePath devuelve OsrmRouteData | null
    this.apiService.getRoutePath(this.origenCoords!, this.destinoCoords!).subscribe({
      next: async (osrmResponse: OsrmRouteData | null) => { // <--- TIPO DE RESPUESTA ACTUALIZADO
        await loading.dismiss();
        this.isCalculatingRoute = false;
        if (osrmResponse && osrmResponse.points && osrmResponse.points.length > 1) {
          this.calculatedPoints = osrmResponse.points;
          // ASIGNAR DISTANCIA Y DURACIÓN
          if (typeof osrmResponse.distance === 'number') {
            this.calculatedDistance = parseFloat((osrmResponse.distance / 1000).toFixed(2)); // Metros a KM
          }
          if (typeof osrmResponse.duration === 'number') {
            this.calculatedDuration = osrmResponse.duration; // Segundos
          }

          if (this.routePolyline) { this.routeMap.removeLayer(this.routePolyline); }
          this.routePolyline = L.polyline(osrmResponse.points, { color: 'blue' }).addTo(this.routeMap);
          this.routeMap.fitBounds(this.routePolyline.getBounds().pad(0.1));
          this.presentToast(`Ruta calculada: ${this.calculatedDistance !== null ? this.calculatedDistance + ' km' : ''}`, "success");
        } else {
          this.calculatedPoints = null;
          this.calculatedDistance = null; // <--- Limpiar si falla
          this.calculatedDuration = null; // <--- Limpiar si falla
          this.routeCalculationError = 'No se pudo calcular una ruta válida desde OSRM.';
          this.presentToast(this.routeCalculationError, "danger");
        }
        this.changeDetectorRef.detectChanges();
      },
      error: async (error) => {
        await loading.dismiss();
        this.isCalculatingRoute = false;
        this.calculatedPoints = null;
        this.calculatedDistance = null; // <--- Limpiar en error
        this.calculatedDuration = null; // <--- Limpiar en error
        this.routeCalculationError = 'Error al conectar con servicio de rutas.';
        console.error("Error cálculo OSRM:", error);
        this.presentToast(this.routeCalculationError, "danger");
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  async saveRoute() {
    this.isSubmitted = true;
    if (this.routeForm.invalid || !this.calculatedPoints || this.calculatedPoints.length === 0) {
       this.presentToast('Asigna un nombre y calcula una ruta válida (con puntos).', 'warning'); return;
    }
    const loading = await this.loadingCtrl.create({ message: this.isEditMode ? 'Actualizando...' : 'Creando...' });
    await loading.present();
    try {
        const puntosParaGuardar: Array<[number, number]> = this.calculatedPoints.map(p => [p[0], p[1]]);

        // Asegúrate que la interfaz Route en api.service.ts incluya kilometrosRuta
        const routeData: Partial<Route> = {
            nombreRuta: this.routeForm.value.nombre,       // Usa el nombre de propiedad de tu interfaz Route
            descripcionRuta: this.routeForm.value.descripcion, // Usa el nombre de propiedad de tu interfaz Route
            puntosRuta: puntosParaGuardar,                  // Usa el nombre de propiedad de tu interfaz Route
            kilometrosRuta: this.calculatedDistance        // <--- GUARDAR LA DISTANCIA
        };

        const saveObservable = this.isEditMode
            ? this.apiService.updateRoute(this.routeId!, routeData)
            : this.apiService.createRoute(routeData);        saveObservable.subscribe({
            next: async (savedRoute) => {
                await this.presentToast(`Ruta ${this.isEditMode ? 'actualizada' : 'creada'} exitosamente.`, 'success');
                // Si es modal, cerrar con datos de éxito
                if (this.modalCtrl) {
                  this.modalCtrl.dismiss({ routeCreated: true }, 'success');
                } else {
                  this.navCtrl.navigateBack('/rutas'); // Fallback para navegación normal
                }
            },
            error: async (error) => {
                console.error("Error guardando ruta:", error);
                let detailMessage = 'Error desconocido.';
                 if (error && error.message) {
                     const match = error.message.match(/Detalle: (.*)/);
                     detailMessage = match && match[1] ? match[1] : error.message;
                 }
                await this.presentAlert('Error al Guardar', `No se pudo guardar la ruta. ${detailMessage}`);
            },
            complete: async () => { if (loading) await loading.dismiss(); }
        });
    } catch (error) {
        if (loading) await loading.dismiss();
        console.error("Error inesperado en saveRoute:", error);        await this.presentAlert('Error', 'Ocurrió un error inesperado al guardar.');
    }  }

  async closeModal() {
    await this.modalCtrl.dismiss();
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({ header, message, buttons: ['OK'] });
    await alert.present();
  }
  async presentToast(message: string, color: 'success'|'warning'|'danger'|'medium' = 'medium') {
    const toast = await this.toastCtrl.create({ message, duration: 3000, position: 'bottom', color });
    await toast.present();
  }
}