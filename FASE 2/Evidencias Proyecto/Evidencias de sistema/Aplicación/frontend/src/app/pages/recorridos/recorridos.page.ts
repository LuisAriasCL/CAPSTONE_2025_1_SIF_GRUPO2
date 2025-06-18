import { Component, OnInit, OnDestroy, NgZone, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import * as L from 'leaflet';

import { AuthService } from '../../services/auth.service';
import { ApiService, Vehiculo, Route as RutaInterface } from '../../services/api.service';
import { SocketService } from '../../services/socket.service';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';

const iconRetinaUrl = 'assets/marker-icon-2x.png';
const iconUrl = 'assets/marker-icon.png';
const shadowUrl = 'assets/marker-shadow.png';
const iconDefault = L.icon({
  iconRetinaUrl, iconUrl, shadowUrl,
  iconSize: [25, 41], iconAnchor: [12, 41],
  popupAnchor: [1, -34], tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = iconDefault;

interface VehiculoConDatosSimulacion extends Vehiculo {
  asignacionId?: number;
  nombreRutaSimulacion?: string;
}

@Component({
  selector: 'app-recorridos',
  templateUrl: 'recorridos.page.html',
  styleUrls: ['recorridos.page.scss'],  
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class HomePage implements OnInit, OnDestroy {
  @ViewChild('mapContainer') mapContainerRef!: ElementRef<HTMLDivElement>;

  private map!: L.Map;
  private vehicleMarkers: { [vehicleId: number]: L.Marker } = {};
  private subscriptions = new Subscription();
  private queryParamsSubscription: Subscription | undefined;
  private navigationSubscription: Subscription | undefined;

  public vehiculoIdParaSeguir: number | null = null;
  private rutaIdParaDibujar: number | null = null;
  private asignacionIdContexto: number | null = null;
  private polylineRutaActual: L.Polyline | null = null;
  public nombreRutaMostrada: string | null = "Mapa de Flota";

  constructor(
    private apiService: ApiService,
    private socketService: SocketService,
    private zone: NgZone,
    private authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    public navCtrl: NavController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    console.log('[Recorridos] ngOnInit: Inicializando página de recorridos.');
    this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(params => {
      console.log('[Recorridos] ngOnInit: Actualizando estado desde query params.', params);
      this.actualizarEstadoDesdeQueryParams(params);
    });

    this.navigationSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd && this.router.url.startsWith('/recorridos'))
    ).subscribe(() => {
      console.log('[Recorridos] ngOnInit: Detectado cambio de navegación.');
      const currentParams = this.activatedRoute.snapshot.queryParams;
      this.actualizarEstadoDesdeQueryParams(currentParams);
      if (this.map) {
        this.zone.run(async () => {
          console.log('[Recorridos] ngOnInit: Configurando vista según query params.');
          await this.configurarVistaSegunQueryParams();
        });
      }
    });
  }
  
  private actualizarEstadoDesdeQueryParams(params: any) {
    const nuevaAsignacionId = params['asignacionId'] ? parseInt(params['asignacionId'], 10) : null;
    const nuevoVehiculoId = params['vehiculoId'] ? parseInt(params['vehiculoId'], 10) : null;
    const nuevaRutaId = params['rutaId'] ? parseInt(params['rutaId'], 10) : null;

    if (nuevaAsignacionId !== this.asignacionIdContexto || nuevoVehiculoId !== this.vehiculoIdParaSeguir || nuevaRutaId !== this.rutaIdParaDibujar) {
      this.asignacionIdContexto = nuevaAsignacionId;
      this.vehiculoIdParaSeguir = nuevoVehiculoId;
      this.rutaIdParaDibujar = nuevaRutaId;
      this.nombreRutaMostrada = this.vehiculoIdParaSeguir ? "Seguimiento de Recorrido..." : "Mapa de Flota";
    }
  }

  ionViewWillEnter() {
    console.log('[Recorridos] ionViewWillEnter: Página está a punto de entrar en vista.');
    if (this.socketService.isConnected()) {
      console.log('[Recorridos] ionViewWillEnter: Socket ya conectado.');
      this.subscribeToAsignacionRoom();
    } else {
      console.log('[Recorridos] ionViewWillEnter: Conectando socket.');
      this.socketService.connect();
      const connectSub = this.socketService.listen('connect').subscribe(() => {
        console.log('[Recorridos] ionViewWillEnter: Socket conectado.');
        this.subscribeToAsignacionRoom();
      });
      this.subscriptions.add(connectSub);
    }
    this.listenToSocketEvents();
  }
  
  private subscribeToAsignacionRoom() {
    if (this.asignacionIdContexto) {
      this.socketService.emit('subscribeToAsignacion', { asignacionId: this.asignacionIdContexto });
    }
  }
  ionViewDidEnter() {
    console.log('[Recorridos] ionViewDidEnter: Página ha entrado en vista.');
    setTimeout(async () => {
      if (!this.map && this.mapContainerRef?.nativeElement) {
        console.log('[Recorridos] ionViewDidEnter: Inicializando mapa.');
        await this.initMap();
      } else if (this.map) {
        console.log('[Recorridos] ionViewDidEnter: Invalidando tamaño del mapa.');
        this.map.invalidateSize(true);
      }
      
      if (this.map) {
        console.log('[Recorridos] ionViewDidEnter: Configurando vista según query params.');
        await this.configurarVistaSegunQueryParams();
      } else {
        console.error('[Recorridos] ionViewDidEnter: Falló la inicialización del mapa.');
      }
    }, 200);
  }

  ionViewDidLeave() {
    console.log('[Recorridos] ionViewDidLeave: Página ha salido de la vista.');
    if (this.asignacionIdContexto) {
      console.log('[Recorridos] ionViewDidLeave: Desuscribiendo de asignación.');
      this.socketService.emit('unsubscribeFromAsignacion', { asignacionId: this.asignacionIdContexto });
    }
  }

  ngOnDestroy() {
    console.log('[Recorridos] ngOnDestroy: Destruyendo página de recorridos.');
    this.queryParamsSubscription?.unsubscribe();
    this.navigationSubscription?.unsubscribe();
    this.subscriptions?.unsubscribe();

    if (this.asignacionIdContexto) {
      console.log('[Recorridos] ngOnDestroy: Desuscribiendo de asignación.');
      this.socketService.emit('unsubscribeFromAsignacion', { asignacionId: this.asignacionIdContexto });
    }
    if (this.map) {
      console.log('[Recorridos] ngOnDestroy: Eliminando mapa.');
      this.map.remove();
    }
  }

  private async configurarVistaSegunQueryParams() {
    console.log('[Recorridos] configurarVistaSegunQueryParams: Configurando vista según query params.');
    if (!this.map) return;
    
    this.limpiarRutaAnteriorDelMapa();

    if (this.rutaIdParaDibujar) {
      console.log('[Recorridos] configurarVistaSegunQueryParams: Dibujando ruta en mapa.');
      await this.dibujarRutaEnMapa(this.rutaIdParaDibujar);
    }

    if (this.vehiculoIdParaSeguir) {
      console.log('[Recorridos] configurarVistaSegunQueryParams: Limpiando marcadores excepto el vehículo a seguir.');
      this.limpiarMarcadoresExcepto(this.vehiculoIdParaSeguir);
      await this.loadAndFocusSpecificVehicle(this.vehiculoIdParaSeguir);
    } else {
      console.log('[Recorridos] configurarVistaSegunQueryParams: Mostrando mapa de flota.');
      this.nombreRutaMostrada = "Mapa de Flota";
      this.limpiarTodosLosMarcadores();
      await this.loadInitialVehicles();
    }
    this.cdr.detectChanges();
  }

  private limpiarRutaAnteriorDelMapa(): void {
    if (this.polylineRutaActual && this.map?.hasLayer(this.polylineRutaActual)) {
      this.map.removeLayer(this.polylineRutaActual);
    }
    this.polylineRutaActual = null;
  }
  
  private limpiarTodosLosMarcadores(): void {
    if (this.map) {
      Object.values(this.vehicleMarkers).forEach(marker => this.map.removeLayer(marker));
    }
    this.vehicleMarkers = {};
  }

  private limpiarMarcadoresExcepto(idVehiculoAMantener: number): void {
    if (!this.map) return;
    for (const idStr in this.vehicleMarkers) {
      const id = parseInt(idStr, 10);
      if (id !== idVehiculoAMantener) {
        this.map.removeLayer(this.vehicleMarkers[id]);
        delete this.vehicleMarkers[id];
      }
    }
  }
  
  private async initMap(): Promise<void> {
    console.log('[Recorridos] initMap: Inicializando mapa.');
    if (this.map) {
      console.log('[Recorridos] initMap: Invalidando tamaño del mapa existente.');
      this.map.invalidateSize(true);
      return;
    }
    if (!this.mapContainerRef || !this.mapContainerRef.nativeElement) {
      console.error('[Recorridos] initMap: ¡ERROR CRÍTICO! mapContainerRef o su nativeElement es undefined.');
      return;
    }
    const mapContainer = this.mapContainerRef.nativeElement;
    try {
      const initialCoords: L.LatLngTuple = [-36.8201, -73.0443];
      const initialZoom = 13;
      this.map = L.map(mapContainer, { center: initialCoords, zoom: initialZoom, attributionControl: false });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, minZoom: 3
      }).addTo(this.map);
      L.control.attribution({prefix: '<a href="https://leafletjs.com" title="A JS library for interactive maps">Leaflet</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(this.map);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      if (this.map) {
        console.log('[Recorridos] initMap: Invalidando tamaño del mapa.');
        this.map.invalidateSize(true);
      }
    } catch (e) {
      console.error('[Recorridos] initMap: Error durante la creación del mapa Leaflet:', e);
    }
  }

  private async loadInitialVehicles(): Promise<void> {
    console.log('[Recorridos] loadInitialVehicles: Cargando vehículos iniciales.');
    if (this.vehiculoIdParaSeguir) {
      console.log('[Recorridos] loadInitialVehicles: Vehículo para seguir ya definido.');
      return;
    }
    
    const sub = this.apiService.getVehicles().subscribe({
      next: (vehiculos: Vehiculo[]) => {
        console.log('[Recorridos] loadInitialVehicles: Vehículos cargados.', vehiculos);
        this.zone.run(() => {
          vehiculos.forEach(vehiculo => {
            if (vehiculo.idVehi !== undefined) {
              this.updateMarker(vehiculo);
            }
          });
          if (Object.keys(this.vehicleMarkers).length > 0 && !this.polylineRutaActual) { 
            console.log('[Recorridos] loadInitialVehicles: Ajustando límites del mapa.');
            this.fitMapToBounds();
          }
        });
      },
      error: (err) => console.error('[Recorridos] loadInitialVehicles: Error:', err)
    });
    this.subscriptions.add(sub);
  }

  private async loadAndFocusSpecificVehicle(vehicleId: number): Promise<void> {
    console.log(`[Recorridos] loadAndFocusSpecificVehicle: Cargando y centrando vehículo ID ${vehicleId}.`);
    try {
      const vehiculo = await this.apiService.getVehicle(vehicleId).toPromise();
      if (vehiculo) {
        console.log('[Recorridos] loadAndFocusSpecificVehicle: Vehículo cargado.', vehiculo);
        this.zone.run(() => {
          this.updateMarker(vehiculo); 
          if (vehiculo.latitud != null && vehiculo.longitud != null && this.map) {
            const newPosition: L.LatLngTuple = [vehiculo.latitud, vehiculo.longitud];
            console.log('[Recorridos] loadAndFocusSpecificVehicle: Centrándose en el vehículo.', newPosition);
            this.map.setView(newPosition, 16);
          }
        });
      } else {
        console.warn(`[Recorridos] loadAndFocusSpecificVehicle: Vehículo ID ${vehicleId} no encontrado.`);
      }
    } catch (error) {
      console.error(`[Recorridos] loadAndFocusSpecificVehicle: Error cargando vehículo ID ${vehicleId}.`, error);
    }
  }

  private listenToSocketEvents(): void {
    console.log('[Recorridos] listenToSocketEvents: Configurando eventos de socket.');
    this.subscriptions.unsubscribe(); 
    this.subscriptions = new Subscription();

    const vehicleUpdatedSub = this.socketService.listen<VehiculoConDatosSimulacion>('vehicleUpdated').subscribe(vehiculoData => {
      console.log('[Recorridos] listenToSocketEvents: Actualización de vehículo recibida.', vehiculoData);
      this.zone.run(() => {
        if (this.asignacionIdContexto && vehiculoData.asignacionId !== undefined && vehiculoData.asignacionId !== this.asignacionIdContexto) {
          return;
        }
        if (!this.asignacionIdContexto || (vehiculoData.idVehi !== undefined && vehiculoData.idVehi === this.vehiculoIdParaSeguir)) {
          this.updateMarker(vehiculoData);
          if (this.vehiculoIdParaSeguir && vehiculoData.idVehi === this.vehiculoIdParaSeguir && this.map && vehiculoData.latitud != null && vehiculoData.longitud != null) {
            const newPosition: L.LatLngTuple = [vehiculoData.latitud, vehiculoData.longitud];
            console.log('[Recorridos] listenToSocketEvents: Centrándose en el vehículo actualizado.', newPosition);
            this.map.setView(newPosition, 16);
          }
          if (this.asignacionIdContexto && vehiculoData.asignacionId === this.asignacionIdContexto && vehiculoData.nombreRutaSimulacion && this.nombreRutaMostrada !== vehiculoData.nombreRutaSimulacion && !this.nombreRutaMostrada?.includes('(Finalizada)')) {
            this.nombreRutaMostrada = vehiculoData.nombreRutaSimulacion;
            this.cdr.detectChanges();
          }
        }
      });
    });
    this.subscriptions.add(vehicleUpdatedSub);

    const createSub = this.socketService.listen<Vehiculo>('vehicleCreated').subscribe(vehiculo => {
      console.log('[Recorridos] listenToSocketEvents: Vehículo creado.', vehiculo);
      if (!this.vehiculoIdParaSeguir || (vehiculo.idVehi !== undefined && vehiculo.idVehi === this.vehiculoIdParaSeguir)) {
        this.zone.run(() => this.updateMarker(vehiculo));
      }
    });
    this.subscriptions.add(createSub);

    const deleteSub = this.socketService.listen<{ id: number }>('vehicleDeleted').subscribe(data => {
      console.log('[Recorridos] listenToSocketEvents: Vehículo eliminado.', data);
      if (!this.vehiculoIdParaSeguir || data.id === this.vehiculoIdParaSeguir) {
        this.zone.run(() => this.removeMarker(data.id));
        if (data.id === this.vehiculoIdParaSeguir) {
          console.log('[Recorridos] listenToSocketEvents: Vehículo seguido eliminado.');
          this.presentToast('El vehículo que estabas siguiendo ha sido eliminado.', 'warning');
          this.clearTrackingAndReturnToList();
        }
      }
    });
    this.subscriptions.add(deleteSub);
    
    const simEndedSub = this.socketService.listen<any>('simulationEnded').subscribe(data => {
      console.log('[Recorridos] listenToSocketEvents: Simulación finalizada.', data);
      if (this.asignacionIdContexto && data.asignacionId === this.asignacionIdContexto) {
        this.presentToast(`Simulación para ${data.routeName || 'la ruta'} ha finalizado.`, 'primary');
        this.nombreRutaMostrada = `${data.routeName || 'Ruta'} (Finalizada)`;
        this.cdr.detectChanges();
      }
    });
    this.subscriptions.add(simEndedSub);
    
    const simErrorSub = this.socketService.listen<any>('simulationError').subscribe(data => {
      console.error('[Recorridos] listenToSocketEvents: Error en simulación.', data);
      this.presentToast(`Error en simulación: ${data.message ? data.message : 'Error desconocido'}`, 'danger');
    });
    this.subscriptions.add(simErrorSub);
  }

  private async dibujarRutaEnMapa(rutaId: number): Promise<void> {
    console.log(`[Recorridos] dibujarRutaEnMapa: Dibujando ruta ID ${rutaId} en el mapa.`);
    if (!this.map) {
      return;
    }
    this.limpiarRutaAnteriorDelMapa();
    try {
      const rutaData = await this.apiService.getRoute(rutaId).toPromise(); 
      if (rutaData && rutaData.puntosRuta && Array.isArray(rutaData.puntosRuta) && rutaData.puntosRuta.length > 0) {
        const coordenadasLeaflet = rutaData.puntosRuta.map((p: any) => 
            Array.isArray(p) && p.length === 2 && typeof p[0] === 'number' && typeof p[1] === 'number' ? [p[0], p[1]] : null
        ).filter(p => p !== null) as L.LatLngExpression[];

        if (coordenadasLeaflet.length > 0) {
          this.polylineRutaActual = L.polyline(coordenadasLeaflet, { color: 'blue', weight: 4, opacity: 0.7 }).addTo(this.map);
          this.map.fitBounds(this.polylineRutaActual.getBounds().pad(0.1));
          this.nombreRutaMostrada = rutaData.nombreRuta || `Ruta #${rutaData.idRuta}`;
        } else {
          this.nombreRutaMostrada = `${rutaData.nombreRuta || `Ruta ${rutaId}`} (Sin trazado válido)`;
        }
      } else {
        this.nombreRutaMostrada = `Ruta ${rutaId} (No encontrada o sin puntos)`;
      }
    } catch (error) {
      this.nombreRutaMostrada = `Ruta ${rutaId} (Error al cargar)`;
      console.error(`[Recorridos] Error al obtener/dibujar la ruta ID ${rutaId}:`, error);
    }
    this.cdr.detectChanges();
  }

  private updateMarker(vehiculoData: VehiculoConDatosSimulacion): void {
    if (!this.map) {
      return;
    }
    const { idVehi, latitud, longitud } = vehiculoData;
    if (idVehi === undefined || latitud == null || longitud == null) {
      return;
    }

    if (this.vehiculoIdParaSeguir !== null && idVehi !== this.vehiculoIdParaSeguir) {
      return;
    }
    
    const position: L.LatLngTuple = [latitud, longitud];
    if (this.vehicleMarkers[idVehi]) {
      const marker = this.vehicleMarkers[idVehi];
      marker.setLatLng(position);
      marker.setPopupContent(this.createPopupContent(vehiculoData));
    } else {
      const newMarker = L.marker(position).addTo(this.map).bindPopup(this.createPopupContent(vehiculoData));
      this.vehicleMarkers[idVehi] = newMarker;
    }
  }

  private removeMarker(vehicleId: number): void {
    if (!this.map || !this.vehicleMarkers[vehicleId]) return;
    const marker = this.vehicleMarkers[vehicleId];
    if (this.map.hasLayer(marker)) {
      this.map.removeLayer(marker);
    }
    delete this.vehicleMarkers[vehicleId];
  }
  
  private createPopupContent(vehiculo: VehiculoConDatosSimulacion): string {
    const displayName = vehiculo.marca && vehiculo.modelo ? `${vehiculo.marca} ${vehiculo.modelo}` : (vehiculo.patente || `Vehículo ${vehiculo.idVehi}`);

    const latitudNum = parseFloat(vehiculo.latitud as any);
    const longitudNum = parseFloat(vehiculo.longitud as any);

    const latStr = !isNaN(latitudNum) ? latitudNum.toFixed(6) : 'N/A';
    const lonStr = !isNaN(longitudNum) ? longitudNum.toFixed(6) : 'N/A';
    
    let html = `<b>${displayName}</b><br>`;
    if(vehiculo.patente) html += `Patente: ${vehiculo.patente}<br>`;
    if(vehiculo.estadoVehi) html += `Estado: ${vehiculo.estadoVehi.charAt(0).toUpperCase() + vehiculo.estadoVehi.slice(1)}<br>`;
    
    let rutaEnPopup = "";
    if (this.nombreRutaMostrada && this.polylineRutaActual && vehiculo.idVehi === this.vehiculoIdParaSeguir) {
      rutaEnPopup = this.nombreRutaMostrada;
    } else if (vehiculo.nombreRutaSimulacion) {
      rutaEnPopup = vehiculo.nombreRutaSimulacion + " (Sim)";
    }
    if (rutaEnPopup) html += `Ruta: ${rutaEnPopup}<br>`;

    html += `<hr style="margin: 2px 0;">Lat: ${latStr}, Lon: ${lonStr}`;
    if(vehiculo.anio) html += `<br><small>Año: ${vehiculo.anio}</small>`;
    return html;
  }

  private fitMapToBounds(): void {
    if (!this.map || Object.keys(this.vehicleMarkers).length === 0) return;
    if (this.polylineRutaActual && this.vehiculoIdParaSeguir) return;
    const group = L.featureGroup(Object.values(this.vehicleMarkers));
    this.map.fitBounds(group.getBounds().pad(0.3));
  }

  centerOnTrackedVehicle() {
    if (this.vehiculoIdParaSeguir && this.vehicleMarkers[this.vehiculoIdParaSeguir] && this.map) {
      const marker = this.vehicleMarkers[this.vehiculoIdParaSeguir];
      this.map.setView(marker.getLatLng(), this.map.getZoom() < 15 ? 15 : this.map.getZoom()); 
    } else if (this.map && Object.keys(this.vehicleMarkers).length > 0 && !this.vehiculoIdParaSeguir) {
      this.fitMapToBounds(); 
    } else {
      this.presentToast('No hay vehículo específico para centrar o no hay marcadores.', 'medium');
    }
  }
  
  logout() {
    this.authService.logout(); 
  }

  clearTrackingAndReturnToList() {
    if (this.asignacionIdContexto) {
      this.socketService.emit('unsubscribeFromAsignacion', { asignacionId: this.asignacionIdContexto });
    }
    this.router.navigate(['/asignacion-list']); 
  }
  
  async presentToast(message: string, color: 'success' | 'warning' | 'danger' | 'primary' | 'medium' = 'medium', duration: number = 3000) {
    const toast = await this.toastCtrl.create({ message, duration, color, position: 'middle', mode: 'md' });
    toast.present();
  }
}