import { Component, OnInit, OnDestroy, AfterViewInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { IonicModule, ViewDidEnter } from '@ionic/angular'; 
import { Subscription } from 'rxjs';
import * as L from 'leaflet'; 
import { ViewChild, ElementRef } from '@angular/core';
import { AuthService } from '../../services/auth.service'; // 

import { ApiService, Vehicle } from '../../services/api.service';
import { SocketService } from '../../services/socket.service';
import { Router } from '@angular/router';

import { RouterLink } from '@angular/router'; 

// recorridos

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
  selector: 'app-recorridos',
  templateUrl: 'recorridos.page.html',
  styleUrls: ['recorridos.page.scss'],
  standalone: true, 
  imports: [
    IonicModule, 
    CommonModule    
  ]
})
export class HomePage implements OnInit, ViewDidEnter, OnDestroy {
  @ViewChild('mapContainer') mapContainerRef!: ElementRef<HTMLDivElement>; 

  private map!: L.Map; 
  
  private vehicleMarkers: { [vehicleId: number]: L.Marker } = {};
  private subscriptions = new Subscription(); 

 

  constructor(
    private apiService: ApiService,
    private socketService: SocketService,
    private zone: NgZone,
    private authService: AuthService, 
    private router: Router 
  ) {}

  // --- Ciclo de Vida del Componente ---

  ngOnInit() {

    console.log("[Mapa] ngOnInit ejecutado.");
}

ionViewWillEnter() {
    console.log("[Mapa] ionViewWillEnter: Configurando listeners de Socket...");
    
    this.listenToSocketEvents();
}

ionViewDidEnter() {
    console.log("[Mapa] ionViewDidEnter: Inicializando mapa (si no existe)...");
    this.initMap();
}

ionViewWillLeave() {
    console.log("[Mapa] ionViewWillLeave: Limpiando suscripciones de Socket...");
    // Desuscribirse de los eventos al salir de la página para evitar duplicados
    this.subscriptions.unsubscribe();
    // Crear una nueva instancia para futuras suscripciones si se vuelve a entrar
    this.subscriptions = new Subscription();
}

ngOnDestroy() {
    console.log("[Mapa] ngOnDestroy: Limpieza final.");
    // Limpieza final si el componente se destruye completamente
    if (!this.subscriptions.closed) {
        this.subscriptions.unsubscribe();
    }
  
   
    if (this.map) {
        this.map.remove();
        console.log("[Mapa] Instancia del mapa Leaflet eliminada.");
    }
}

  // --- Inicialización del Mapa ---

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
  // --- Carga de Datos y Escucha de Eventos ---

  private loadInitialVehicles(): void {
    const sub = this.apiService.getVehicles().subscribe({
      next: (vehicles: Vehicle[]) => {
        console.log(`Vehículos iniciales recibidos (${vehicles.length}):`, vehicles);
         
         this.zone.run(() => {
            vehicles.forEach(vehicle => this.updateMarker(vehicle));
           
         });
      },
      error: (err) => console.error('Error al cargar vehículos iniciales:', err)
    });
    this.subscriptions.add(sub); 
  }

  private listenToSocketEvents(): void {
    console.log("Empezando a escuchar eventos de Socket.IO...");

  
    const createSub = this.socketService.listen<Vehicle>('vehicleCreated').subscribe(vehicle => {
      console.log('Evento Socket.IO [vehicleCreated] recibido:', vehicle);
      // Ejecutar la actualización del marcador dentro de NgZone
      this.zone.run(() => {
          this.updateMarker(vehicle);
      });
    });

    // Escuchar evento 'vehicleUpdated'
    const updateSub = this.socketService.listen<Vehicle>('vehicleUpdated').subscribe(vehicle => {
      console.log('Evento Socket.IO [vehicleUpdated] recibido:', vehicle);
      this.zone.run(() => {
          this.updateMarker(vehicle);
      });
    });

    // Escuchar evento 'vehicleDeleted'
    const deleteSub = this.socketService.listen<{ id: number }>('vehicleDeleted').subscribe(data => {
      console.log('Evento Socket.IO [vehicleDeleted] recibido:', data);
      this.zone.run(() => {
          this.removeMarker(data.id);
      });
    });

    // Añadir todas las suscripciones al gestor para limpieza automática
    this.subscriptions.add(createSub);
    this.subscriptions.add(updateSub);
    this.subscriptions.add(deleteSub);
  }

  // --- Gestión de Marcadores en el Mapa ---

  private updateMarker(vehicle: Vehicle): void {
    if (!this.map) {
        console.warn("Mapa no inicializado, no se puede actualizar marcador para:", vehicle.name);
        return; // Salir si el mapa no está listo
    }
    if (vehicle.latitude == null || vehicle.longitude == null) {
        console.warn("Vehículo sin coordenadas, no se puede mostrar:", vehicle.name);
        return;
    }

    const vehicleId = vehicle.id;
    const position: L.LatLngTuple = [vehicle.latitude, vehicle.longitude];

    if (this.vehicleMarkers[vehicleId]) {
      // --- El marcador YA EXISTE: Actualizar posición y popup ---
      console.log(`Actualizando marcador para: ${vehicle.name} (ID: ${vehicleId})`);
      const marker = this.vehicleMarkers[vehicleId];
      marker.setLatLng(position);
      // Actualizar contenido del popup si está abierto o al abrirse
      marker.bindPopup(this.createPopupContent(vehicle));

    } else {
      // --- El marcador NO EXISTE: Crear uno nuevo ---
      console.log(`Creando nuevo marcador para: ${vehicle.name} (ID: ${vehicleId})`);
      const newMarker = L.marker(position /*, { icon: this.vehicleIcon } */) 
        .addTo(this.map)
        .bindPopup(this.createPopupContent(vehicle));

      
      this.vehicleMarkers[vehicleId] = newMarker;
    }
  }

  private removeMarker(vehicleId: number): void {
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

  // --- Helpers ---

 
  private createPopupContent(vehicle: Vehicle): string {
    const updated = vehicle.updatedAt ? new Date(vehicle.updatedAt).toLocaleString() : 'N/A';
    const latString = vehicle.latitude != null ? parseFloat(String(vehicle.latitude)).toFixed(6) : 'N/A';
    const lonString = vehicle.longitude != null ? parseFloat(String(vehicle.longitude)).toFixed(6) : 'N/A';
  
    return `
      <b>${vehicle.name}</b><br>
      Matrícula: ${vehicle.plate}<br>
      Estado: ${vehicle.status}<br>
      <hr style="margin: 3px 0;">
      <small>Lat: ${latString}</small><br>  sGreet
      <small>Lon: ${lonString}</small><br>
      <small>Últ. Act: ${updated}</small>
    `;
  }

  // Dentro de la clase HomePage
 logout() {
  console.log('HomePage: Llamando a authService.logout()');
  this.authService.logout();

}
  
  private fitMapToBounds(): void {
      if (!this.map) return;
      const markerIds = Object.keys(this.vehicleMarkers);
      if (markerIds.length === 0) return; // No hay marcadores

      const group = L.featureGroup(markerIds.map(id => this.vehicleMarkers[parseInt(id,10)]));
      this.map.fitBounds(group.getBounds().pad(0.3)); 
  }

   // --- Opcional: Función de Simulación (para pruebas rápidas) ---
  // Si habilitaste el botón FAB en el HTML, descomenta esta función
  /*
  simulateUpdate() {
    const vehicleIds = Object.keys(this.vehicleMarkers).map(idStr => parseInt(idStr, 10));
    if (vehicleIds.length === 0) {
      console.warn("No hay vehículos en el mapa para simular actualización.");
      return;
    }

    // Elegir un vehículo al azar
    const randomId = vehicleIds[Math.floor(Math.random() * vehicleIds.length)];
    const marker = this.vehicleMarkers[randomId];
    const currentLatLng = marker.getLatLng();

    // Calcular nueva posición aleatoria cercana
    const newLat = currentLatLng.lat + (Math.random() - 0.5) * 0.01; // Pequeño cambio
    const newLng = currentLatLng.lng + (Math.random() - 0.5) * 0.01;

    console.log(`Simulando actualización para vehículo ID <span class="math-inline">\{randomId\}\: \[</span>{newLat}, ${newLng}]`);

    // Llamar a la API para guardar la nueva ubicación
    // Esto hará que el backend emita 'vehicleUpdated' a través de Socket.IO
    const sub = this.apiService.updateVehicle(randomId, { latitude: newLat, longitude: newLng })
      .subscribe({
          next: updatedVehicle => {
              console.log('Simulación: Ubicación actualizada en backend para', updatedVehicle.name);
              // No necesitamos hacer nada más aquí, el evento 'vehicleUpdated'
              // recibido por el listener de Socket.IO moverá el marcador.
          },
          error: err => console.error('Error simulando actualización:', err)
      });
    // No necesitamos añadir esta suscripción a this.subscriptions si no necesitamos desuscribirnos
    // ya que la petición HTTP se completa sola.
  }
  */

}