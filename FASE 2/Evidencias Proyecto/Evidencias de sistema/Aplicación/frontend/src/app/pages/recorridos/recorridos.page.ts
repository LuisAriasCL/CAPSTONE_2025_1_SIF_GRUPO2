// DESPUÉS (CORREGIDO):
import { Component, OnInit, OnDestroy, NgZone, ElementRef, ViewChild } from '@angular/core'; // ViewDidEnter y AfterViewInit eliminados si no se usan explícitamente como interfaz
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular'; // ViewDidEnter NO se importa de aquí
import { Subscription } from 'rxjs';
import * as L from 'leaflet';
import { AuthService } from '../../services/auth.service';
// Importar ApiService y la NUEVA interfaz Vehiculo.
// Asegúrate de que Vehiculo esté EXPORTADO desde api.service.ts o desde un archivo de interfaces.
import { ApiService, Vehiculo } from '../../services/api.service'; // CAMBIO AQUÍ: Vehicle -> Vehiculo
import { SocketService } from '../../services/socket.service';
import { Router } from '@angular/router';

// RouterLink no es necesario importar en el .ts si solo se usa en la plantilla
// import { RouterLink } from '@angular/router';

// Definición de íconos de Leaflet (se mantiene igual)
const iconRetinaUrl = 'assets/marker-icon-2x.png';
const iconUrl = 'assets/marker-icon.png';
const shadowUrl = 'assets/marker-shadow.png';
const iconDefault = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-recorridos', // Asumo que el selector correcto es este o 'app-home' si la clase es HomePage
  templateUrl: 'recorridos.page.html', // O 'home.page.html'
  styleUrls: ['recorridos.page.scss'],  // O 'home.page.scss'
  standalone: true,
  imports: [
    IonicModule,
    CommonModule
    // RouterLink no se importa aquí directamente en standalone components, se importa en el módulo o en el array de imports del componente si es necesario.
  ]
})
export class HomePage implements OnInit,  OnDestroy { // Tu clase se llama HomePage
  @ViewChild('mapContainer') mapContainerRef!: ElementRef<HTMLDivElement>;

  private map!: L.Map;
  // CORREGIDO: El ID del vehículo ahora será number (idVehi de la interfaz Vehiculo)
  private vehicleMarkers: { [vehicleId: number]: L.Marker } = {};
  private subscriptions = new Subscription();

  constructor(
    private apiService: ApiService,
    private socketService: SocketService,
    private zone: NgZone,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    console.log("[Mapa] ngOnInit ejecutado.");
  }

  ionViewWillEnter() {
    console.log("[Mapa] ionViewWillEnter: Configurando listeners de Socket...");
    this.listenToSocketEvents();
  }

  ionViewDidEnter() {
    console.log("[Mapa] ionViewDidEnter: Inicializando mapa (si no existe)...");
    // Retrasar un poco la inicialización del mapa para asegurar que el contenedor esté visible
    // Esto es una heurística, podría necesitarse una detección más robusta del renderizado del DOM.
    setTimeout(() => {
        this.initMap();
    }, 100);
  }

  ionViewWillLeave() {
    console.log("[Mapa] ionViewWillLeave: Limpiando suscripciones de Socket...");
    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();
  }

  ngOnDestroy() {
    console.log("[Mapa] ngOnDestroy: Limpieza final.");
    if (!this.subscriptions.closed) {
      this.subscriptions.unsubscribe();
    }
    if (this.map) {
      this.map.remove();
      console.log("[Mapa] Instancia del mapa Leaflet eliminada.");
    }
  }

  private initMap(): void {
    if (this.map) {
      console.warn("El mapa ya está inicializado.");
      return;
    }
    console.log("Intentando inicializar mapa usando @ViewChild...");
  
    
    if (!this.mapContainerRef) {
        console.error("¡ERROR CRÍTICO! La referencia @ViewChild 'mapContainerRef' es undefined.");
       
        return;
    }
  
    const mapContainer = this.mapContainerRef.nativeElement; 
  
    console.log("Elemento obtenido vía @ViewChild:", mapContainer);
    console.log(`Dimensiones vía @ViewChild: Ancho=<span class="math-inline">\{mapContainer\.offsetWidth\}, Alto\=</span>{mapContainer.offsetHeight}`);
  
    if (mapContainer.offsetWidth <= 0 || mapContainer.offsetHeight <= 0) {
      console.warn("ADVERTENCIA: El contenedor vía @ViewChild existe pero tiene dimensiones 0.");
       console.error("Las dimensiones son 0, Leaflet probablemente fallará.");
       
    }
    // --- Fin: Comprobaciones usando @ViewChild ---
  
    try {
      const initialCoords: L.LatLngTuple = [-36.8201, -73.0443];
      const initialZoom = 13;
  
      console.log("Creando instancia del mapa Leaflet...");
      this.map = L.map(mapContainer, { 
        center: initialCoords,
        zoom: initialZoom,
      });
  
      const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        minZoom: 3,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      });
      tiles.addTo(this.map);
  
      
      setTimeout(() => {
          if (this.map) { // Verificar que el mapa aún exista
               console.log("Ejecutando map.invalidateSize()...");
               this.map.invalidateSize();
          }
      }, 200); 
      
  
      console.log("Mapa listo. Cargando vehículos iniciales...");
      this.loadInitialVehicles();
  
    } catch (e) {
      console.error("Error durante la creación del mapa Leaflet:", e);
    }
  }

  private loadInitialVehicles(): void {
    // CORREGIDO: Esperar Vehiculo[] y usar la nueva estructura
    const sub = this.apiService.getVehicles().subscribe({
      next: (vehiculos: Vehiculo[]) => { // 'vehiculos' ahora es un array de la nueva interfaz Vehiculo
        console.log(`Vehículos iniciales recibidos (${vehiculos.length}):`, vehiculos);
        this.zone.run(() => {
          vehiculos.forEach(vehiculo => this.updateMarker(vehiculo)); // 'vehiculo' es de tipo Vehiculo
          if (vehiculos.length > 0) { // Ajustar vista si hay vehículos
            this.fitMapToBounds();
          }
        });
      },
      error: (err) => console.error('Error al cargar vehículos iniciales:', err)
    });
    this.subscriptions.add(sub);
  }

  private listenToSocketEvents(): void {
    console.log("Empezando a escuchar eventos de Socket.IO...");

    // CORREGIDO: Usar la nueva interfaz Vehiculo para los listeners
    const createSub = this.socketService.listen<Vehiculo>('vehicleCreated').subscribe(vehiculo => {
      console.log('Evento Socket.IO [vehicleCreated] recibido:', vehiculo);
      this.zone.run(() => {
        this.updateMarker(vehiculo);
      });
    });

    const updateSub = this.socketService.listen<Vehiculo>('vehicleUpdated').subscribe(vehiculo => {
      console.log('Evento Socket.IO [vehicleUpdated] recibido:', vehiculo);
      this.zone.run(() => {
        this.updateMarker(vehiculo);
      });
    });

    const deleteSub = this.socketService.listen<{ id: number }>('vehicleDeleted').subscribe(data => {
      console.log('Evento Socket.IO [vehicleDeleted] recibido:', data);
      this.zone.run(() => {
        // El backend envía { id: vehicleId }, que es el idVehi numérico
        this.removeMarker(data.id);
      });
    });

    this.subscriptions.add(createSub);
    this.subscriptions.add(updateSub);
    this.subscriptions.add(deleteSub);
  }

  // CORREGIDO: El parámetro 'vehiculo' ahora es de tipo Vehiculo
  private updateMarker(vehiculo: Vehiculo): void {
    if (!this.map) {
      // Usar patente o idVehi para identificar, ya que 'name' no existe en Vehiculo
      console.warn("Mapa no inicializado, no se puede actualizar marcador para:", vehiculo.patente || vehiculo.idVehi);
      return;
    }
    // Usar los nuevos nombres de campo: latitud, longitud
    if (vehiculo.latitud == null || vehiculo.longitud == null) {
      console.warn("Vehículo sin coordenadas, no se puede mostrar:", vehiculo.patente || vehiculo.idVehi);
      return;
    }

    const vehicleId = vehiculo.idVehi; // Usar idVehi (PK de la nueva interfaz)
    if (vehicleId === undefined) {
        console.warn("Vehículo sin idVehi, no se puede actualizar marcador:", vehiculo);
        return;
    }

    const position: L.LatLngTuple = [vehiculo.latitud, vehiculo.longitud];

    if (this.vehicleMarkers[vehicleId]) {
      console.log(`Actualizando marcador para: ${vehiculo.patente} (ID: ${vehicleId})`);
      const marker = this.vehicleMarkers[vehicleId];
      marker.setLatLng(position);
      marker.bindPopup(this.createPopupContent(vehiculo));
    } else {
      console.log(`Creando nuevo marcador para: ${vehiculo.patente} (ID: ${vehicleId})`);
      const newMarker = L.marker(position)
        .addTo(this.map)
        .bindPopup(this.createPopupContent(vehiculo));
      this.vehicleMarkers[vehicleId] = newMarker;
    }
  }

  private removeMarker(vehicleId: number): void { // vehicleId es idVehi
    if (!this.map) {
      console.warn("Mapa no inicializado, no se puede eliminar marcador ID:", vehicleId);
      return;
    }
    const marker = this.vehicleMarkers[vehicleId];
    if (marker) {
      console.log(`Eliminando marcador para vehículo ID: ${vehicleId}`);
      this.map.removeLayer(marker);
      delete this.vehicleMarkers[vehicleId];
    } else {
      console.warn(`Intento de eliminar marcador no existente para ID: ${vehicleId}`);
    }
  }

  // CORREGIDO: El parámetro 'vehiculo' ahora es de tipo Vehiculo y usamos los nuevos campos
  private createPopupContent(vehiculo: Vehiculo): string {
    // 'updatedAt' no existe en la nueva interfaz Vehiculo, lo omitimos o usamos otro campo si es relevante.
    // 'name' no existe, usamos patente o marca + modelo.
    const displayName = vehiculo.marca && vehiculo.modelo ? `${vehiculo.marca} ${vehiculo.modelo}` : vehiculo.patente;
    const latString = vehiculo.latitud != null ? parseFloat(String(vehiculo.latitud)).toFixed(6) : 'N/A';
    const lonString = vehiculo.longitud != null ? parseFloat(String(vehiculo.longitud)).toFixed(6) : 'N/A';

    return `
      <b>${displayName}</b><br>
      Patente: ${vehiculo.patente}<br>
      Estado: ${vehiculo.estadoVehi ? vehiculo.estadoVehi.charAt(0).toUpperCase() + vehiculo.estadoVehi.slice(1) : 'N/A'}<br>
      <hr style="margin: 3px 0;">
      <small>Lat: ${latString}</small><br>
      <small>Lon: ${lonString}</small><br>
      <small>Año: ${vehiculo.anio || 'N/A'}</small>
    `;
  }

  logout() {
    console.log('HomePage: Llamando a authService.logout()');
    this.authService.logout();
    // Considera navegar al login después del logout si no lo hace authService
    // this.router.navigate(['/login']);
  }

  private fitMapToBounds(): void {
    if (!this.map || Object.keys(this.vehicleMarkers).length === 0) return;
    const group = L.featureGroup(Object.values(this.vehicleMarkers));
    this.map.fitBounds(group.getBounds().pad(0.3));
  }

  // El método simulateUpdate() (comentado en tu código original) también necesitaría
  // ser adaptado para usar los nuevos nombres de campo (latitud, longitud)
  // y el nuevo nombre de la propiedad identificadora (idVehi) si se descomenta y usa.
  // Y llamaría a this.apiService.updateVehicle(randomId, { latitud: newLat, longitud: newLng })
}