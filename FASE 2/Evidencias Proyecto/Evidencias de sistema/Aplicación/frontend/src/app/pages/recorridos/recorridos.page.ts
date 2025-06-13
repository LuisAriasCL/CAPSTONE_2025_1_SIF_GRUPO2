// src/app/pages/recorridos/recorridos.page.ts

import {
  Component,
  OnInit,
  OnDestroy,
  NgZone,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController, ToastController } from '@ionic/angular'; // ToastController AÑADIDO
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import * as L from 'leaflet'; // Importar Leaflet

import { AuthService } from '../../services/auth.service';

import { ApiService, Route as RutaInterface } from '../../services/api.service';
import { Vehiculo } from 'src/types/components.types';
import { SocketService } from '../../services/socket.service';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';

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
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = iconDefault;

// Interfaz para los datos que llegan del evento 'vehicleUpdated' del backend
interface VehiculoConDatosSimulacion extends Vehiculo {
  asignacionId?: number;
  nombreRutaSimulacion?: string;
}

@Component({
  selector: 'app-recorridos',
  templateUrl: 'recorridos.page.html',
  styleUrls: ['recorridos.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class HomePage implements OnInit, OnDestroy {
  // Implementa OnInit y OnDestroy
  @ViewChild('mapContainer') mapContainerRef!: ElementRef<HTMLDivElement>;

  private map!: L.Map;
  private vehicleMarkers: { [vehicleId: number]: L.Marker } = {};
  private subscriptions = new Subscription();
  private queryParamsSubscription: Subscription | undefined;
  private navigationSubscription: Subscription | undefined;

  // Propiedades para el seguimiento específico
  public vehiculoIdParaSeguir: number | null = null;
  private rutaIdParaDibujar: number | null = null;
  private asignacionIdContexto: number | null = null;
  private polylineRutaActual: L.Polyline | null = null;
  public nombreRutaMostrada: string | null = 'Mapa de Flota'; // Título inicial

  constructor(
    private apiService: ApiService,
    private socketService: SocketService,
    private zone: NgZone,
    private authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    public navCtrl: NavController, // Para el ion-back-button si lo usas
    private toastCtrl: ToastController // <<--- ToastController INYECTADO
  ) {}

  ngOnInit() {
    console.log('[Mapa] ngOnInit ejecutado.');
    // Suscripción a queryParams para la carga inicial y cambios directos en URL
    this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(
      (params) => {
        console.log('[Mapa] ngOnInit (queryParams iniciales):', params);
        this.actualizarEstadoDesdeQueryParams(params);
      }
    );

    // Suscripción a NavigationEnd para recargar la configuración si se navega a esta misma página con diferentes queryParams
    this.navigationSubscription = this.router.events
      .pipe(
        filter(
          (event) =>
            event instanceof NavigationEnd &&
            this.router.url.startsWith('/recorridos')
        )
      )
      .subscribe(() => {
        // Forzar la re-lectura de queryParams actuales del snapshot porque la suscripción anterior
        // podría no haberse disparado para esta instancia de NavigationEnd si los params son los mismos objetos.
        const currentParams = this.activatedRoute.snapshot.queryParams;
        console.log(
          '[Mapa] NavigationEnd detectado para /recorridos. Params actuales:',
          currentParams
        );
        this.actualizarEstadoDesdeQueryParams(currentParams);
        if (this.map) {
          // Si el mapa ya está inicializado, reconfigurar la vista
          this.zone.run(async () => {
            await this.configurarVistaSegunQueryParams();
          });
        }
      });
  }

  private actualizarEstadoDesdeQueryParams(params: any) {
    const nuevaAsignacionId = params['asignacionId']
      ? parseInt(params['asignacionId'], 10)
      : null;
    const nuevoVehiculoId = params['vehiculoId']
      ? parseInt(params['vehiculoId'], 10)
      : null;
    const nuevaRutaId = params['rutaId']
      ? parseInt(params['rutaId'], 10)
      : null;

    // Solo actualizar y reconfigurar si hay un cambio real en los IDs de seguimiento
    if (
      nuevaAsignacionId !== this.asignacionIdContexto ||
      nuevoVehiculoId !== this.vehiculoIdParaSeguir ||
      nuevaRutaId !== this.rutaIdParaDibujar
    ) {
      console.log(
        `[Mapa] actualizarEstadoDesdeQueryParams: Detectado cambio en IDs de seguimiento.`
      );
      this.asignacionIdContexto = nuevaAsignacionId;
      this.vehiculoIdParaSeguir = nuevoVehiculoId;
      this.rutaIdParaDibujar = nuevaRutaId;
      this.nombreRutaMostrada = this.vehiculoIdParaSeguir
        ? 'Seguimiento de Recorrido...'
        : 'Mapa de Flota';
      // La reconfiguración de la vista se hará en ionViewDidEnter o si el mapa ya está listo por NavigationEnd
    } else {
      console.log(
        `[Mapa] actualizarEstadoDesdeQueryParams: IDs de seguimiento no cambiaron.`
      );
    }
  }

  ionViewWillEnter() {
    console.log(
      '[Mapa] ionViewWillEnter: Suscribiéndose a eventos de Socket y rooms.'
    );
    // Lógica para unirse al room de Socket.IO si aplica
    if (this.socketService.isConnected()) {
      this.subscribeToAsignacionRoom();
    } else {
      console.log(
        '[Mapa] Socket no conectado inicialmente, intentando conectar y suscribirse...'
      );
      this.socketService.connect(); // Intenta conectar si el servicio lo gestiona así
      const connectSub = this.socketService.listen('connect').subscribe(() => {
        // <<--- CORREGIDO
        console.log(
          "[Mapa] SocketService conectado (evento 'connect'), procediendo a suscribir a room."
        );
        this.subscribeToAsignacionRoom();
        // Ya no es necesario desuscribirse aquí si queremos mantener la capacidad de reconexión
      });
      this.subscriptions.add(connectSub);
    }
    this.listenToSocketEvents(); // Configurar listeners de eventos de vehículos
  }

  private subscribeToAsignacionRoom() {
    if (this.asignacionIdContexto) {
      this.socketService.emit('subscribeToAsignacion', {
        asignacionId: this.asignacionIdContexto,
      });
      console.log(
        `[Mapa] Solicitud de suscripción a room asignacion_${this.asignacionIdContexto} enviada.`
      );
    }
  }

  ionViewDidEnter() {
    console.log('[Mapa] ionViewDidEnter: Inicializando/Configurando mapa...');
    setTimeout(async () => {
      if (!this.map && this.mapContainerRef?.nativeElement) {
        console.log(
          '[Mapa] ionViewDidEnter: Mapa no existe, llamando a initMap.'
        );
        await this.initMap(); // Esperar a que el mapa base esté listo
      } else if (this.map) {
        console.log(
          '[Mapa] ionViewDidEnter: Mapa ya existe, solo invalidando tamaño.'
        );
        this.map.invalidateSize(true);
      }

      if (this.map) {
        await this.configurarVistaSegunQueryParams();
      } else {
        console.error(
          '[Mapa] ionViewDidEnter: Falló la inicialización del mapa, no se puede configurar la vista.'
        );
      }
    }, 200); // Aumentado ligeramente el timeout
  }

  // <<--- MÉTODO ngOnDestroy AÑADIDO Y COMPLETADO --- >>
  ngOnDestroy() {
    console.log('[Mapa] ngOnDestroy: Iniciando limpieza final.');
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
      console.log('[Mapa] ngOnDestroy: queryParamsSubscription desuscrito.');
    }
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
      console.log('[Mapa] ngOnDestroy: navigationSubscription desuscrito.');
    }
    if (this.subscriptions && !this.subscriptions.closed) {
      this.subscriptions.unsubscribe(); // Esto desuscribe todos los listeners de socket añadidos a this.subscriptions
      console.log(
        '[Mapa] ngOnDestroy: this.subscriptions (eventos de socket) desuscrito.'
      );
    }
    // Desuscripción del room si aplica
    if (this.asignacionIdContexto) {
      this.socketService.emit('unsubscribeFromAsignacion', {
        asignacionId: this.asignacionIdContexto,
      });
      console.log(
        `[Mapa] ngOnDestroy: Solicitud de desuscripción del room asignacion_${this.asignacionIdContexto} enviada.`
      );
    }
    if (this.map) {
      this.map.remove(); // Limpiar instancia del mapa Leaflet
      console.log('[Mapa] ngOnDestroy: Instancia del mapa Leaflet eliminada.');
    }
    console.log('[Mapa] ngOnDestroy: Limpieza final completada.');
  }
  // <<--- FIN MÉTODO ngOnDestroy --- >>

  private async configurarVistaSegunQueryParams() {
    if (!this.map) {
      console.warn(
        '[Mapa] configurarVistaSegunQueryParams: Mapa no está listo.'
      );
      return;
    }
    console.log(
      `[Mapa] configurarVistaSegunQueryParams: VehiculoID=${this.vehiculoIdParaSeguir}, RutaID=${this.rutaIdParaDibujar}, AsigID=${this.asignacionIdContexto}`
    );

    this.limpiarRutaAnteriorDelMapa(); // Siempre limpiar para evitar rutas duplicadas

    if (this.rutaIdParaDibujar) {
      await this.dibujarRutaEnMapa(this.rutaIdParaDibujar);
    }

    if (this.vehiculoIdParaSeguir) {
      console.log(
        `[Mapa] Modo Seguimiento Específico para vehículo ${this.vehiculoIdParaSeguir}.`
      );
      this.limpiarMarcadoresExcepto(this.vehiculoIdParaSeguir);
      await this.loadAndFocusSpecificVehicle(this.vehiculoIdParaSeguir);
    } else {
      console.log('[Mapa] Modo Dashboard General.');
      this.nombreRutaMostrada = 'Mapa de Flota'; // Título por defecto para dashboard
      this.limpiarTodosLosMarcadores();
      await this.loadInitialVehicles();
    }
    this.cdr.detectChanges(); // Actualizar UI (ej. título)
  }

  private limpiarRutaAnteriorDelMapa(): void {
    if (
      this.polylineRutaActual &&
      this.map?.hasLayer(this.polylineRutaActual)
    ) {
      this.map.removeLayer(this.polylineRutaActual);
    }
    this.polylineRutaActual = null; // Importante resetear la referencia
    // No resetear nombreRutaMostrada aquí, se maneja en configurarVista o dibujarRuta
    console.log('[Mapa] Polyline de ruta anterior eliminada del mapa.');
  }

  private limpiarTodosLosMarcadores(): void {
    if (this.map) {
      Object.values(this.vehicleMarkers).forEach((marker) => {
        if (this.map.hasLayer(marker)) this.map.removeLayer(marker);
      });
    }
    this.vehicleMarkers = {};
    console.log('[Mapa] Todos los marcadores de vehículos eliminados.');
  }

  private limpiarMarcadoresExcepto(idVehiculoAMantener: number): void {
    if (this.map) {
      for (const idStr in this.vehicleMarkers) {
        const id = parseInt(idStr, 10);
        if (id !== idVehiculoAMantener) {
          if (this.map.hasLayer(this.vehicleMarkers[id]))
            this.map.removeLayer(this.vehicleMarkers[id]);
          delete this.vehicleMarkers[id];
        }
      }
    }
    console.log(
      `[Mapa] Marcadores limpiados excepto para el vehículo ID: ${idVehiculoAMantener}.`
    );
  }

  private async initMap(): Promise<void> {
    if (this.map) {
      console.warn('[Mapa] initMap: El mapa ya está inicializado.');
      this.map.invalidateSize(true); // Aun así, invalidar por si acaso
      return;
    }
    if (!this.mapContainerRef || !this.mapContainerRef.nativeElement) {
      console.error(
        '[Mapa] initMap: ¡ERROR CRÍTICO! mapContainerRef o su nativeElement es undefined.'
      );
      return;
    }
    const mapContainer = this.mapContainerRef.nativeElement;
    console.log(
      '[Mapa] initMap: Intentando inicializar mapa en contenedor:',
      mapContainer
    );
    try {
      const initialCoords: L.LatLngTuple = [-36.8201, -73.0443]; // Concepción, Chile
      const initialZoom = 13;
      this.map = L.map(mapContainer, {
        center: initialCoords,
        zoom: initialZoom,
        attributionControl: false,
      }); // attributionControl false y añadirlo manualmente
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        minZoom: 3,
        // No añadir attribution aquí, se hará con L.control.attribution
      }).addTo(this.map);
      L.control
        .attribution({
          prefix:
            '<a href="https://leafletjs.com" title="A JS library for interactive maps">Leaflet</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        })
        .addTo(this.map);

      await new Promise((resolve) => setTimeout(resolve, 300)); // Aumentar un poco el timeout
      if (this.map) {
        console.log('[Mapa] initMap: Ejecutando map.invalidateSize().');
        this.map.invalidateSize(true);
      }
      console.log('[Mapa] initMap: Mapa Leaflet inicializado.');
    } catch (e) {
      console.error(
        '[Mapa] initMap: Error durante la creación del mapa Leaflet:',
        e
      );
    }
  }

  private async loadInitialVehicles(): Promise<void> {
    if (
      this.vehiculoIdParaSeguir &&
      this.vehicleMarkers[this.vehiculoIdParaSeguir]
    ) {
      console.log(
        '[Mapa] loadInitialVehicles: Ya se sigue un vehículo, no se cargan todos.'
      );
      return;
    }
    console.log(
      '[Mapa] loadInitialVehicles: Cargando todos los vehículos (modo dashboard).'
    );
    const sub = this.apiService.getVehicles().subscribe({
      next: (vehiculos: Vehiculo[]) => {
        console.log(
          `[Mapa] loadInitialVehicles: ${vehiculos.length} vehículos recibidos.`
        );
        this.zone.run(() => {
          vehiculos.forEach((vehiculo) => {
            if (
              vehiculo.idVehi !== undefined &&
              (!this.vehiculoIdParaSeguir ||
                vehiculo.idVehi !== this.vehiculoIdParaSeguir)
            ) {
              this.updateMarker(vehiculo);
            }
          });
          if (
            Object.keys(this.vehicleMarkers).length > 0 &&
            !this.polylineRutaActual
          ) {
            this.fitMapToBounds();
          }
        });
      },
      error: (err) => console.error('[Mapa] loadInitialVehicles: Error:', err),
    });
    this.subscriptions.add(sub);
  }

  private async loadAndFocusSpecificVehicle(vehicleId: number): Promise<void> {
    try {
      const vehiculo = await this.apiService.getVehicle(vehicleId).toPromise();
      if (vehiculo) {
        console.log(
          `[Mapa] loadAndFocusSpecificVehicle: Vehículo ID ${vehicleId} cargado.`
        );
        this.zone.run(() => {
          this.updateMarker(vehiculo);
          if (
            vehiculo.latitud != null &&
            vehiculo.longitud != null &&
            this.map
          ) {
            if (this.polylineRutaActual) {
              // Si hay una ruta, el fitBounds de la ruta tiene prioridad
              const vehicleLatLng = L.latLng(
                vehiculo.latitud,
                vehiculo.longitud
              );
              if (!this.map.getBounds().contains(vehicleLatLng)) {
                // Si el vehículo está fuera de la vista actual de la ruta
                this.map.panTo(vehicleLatLng); // Centrar suavemente
              }
            } else {
              // Si no hay ruta, centrar en el vehículo
              this.map.setView([vehiculo.latitud, vehiculo.longitud], 15);
            }
          }
        });
      } else {
        console.warn(
          `[Mapa] loadAndFocusSpecificVehicle: Vehículo ID ${vehicleId} no encontrado.`
        );
      }
    } catch (error) {
      console.error(
        `[Mapa] loadAndFocusSpecificVehicle: Error cargando vehículo ID ${vehicleId}.`,
        error
      );
    }
  }

  private listenToSocketEvents(): void {
    console.log('[Mapa] listenToSocketEvents: (Re)configurando listeners...');

    // Desuscribir listeners específicos si ya existen para evitar duplicados
    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription(); // Crea un nuevo contenedor de suscripciones

    const vehicleUpdatedSub = this.socketService
      .listen<VehiculoConDatosSimulacion>('vehicleUpdated')
      .subscribe((vehiculoData) => {
        this.zone.run(() => {
          if (
            this.asignacionIdContexto &&
            vehiculoData.asignacionId !== undefined &&
            vehiculoData.asignacionId !== this.asignacionIdContexto
          ) {
            return; // Ignorar si es para otra asignación y estamos en modo seguimiento específico
          }
          if (
            !this.asignacionIdContexto ||
            (vehiculoData.idVehi !== undefined &&
              vehiculoData.idVehi === this.vehiculoIdParaSeguir)
          ) {
            // console.log('[Mapa] Procesando vehicleUpdated para:', JSON.stringify(vehiculoData));
            this.updateMarker(vehiculoData);
            if (
              this.vehiculoIdParaSeguir &&
              vehiculoData.idVehi === this.vehiculoIdParaSeguir &&
              this.map &&
              vehiculoData.latitud != null &&
              vehiculoData.longitud != null
            ) {
              this.map.panTo([vehiculoData.latitud, vehiculoData.longitud]);
            }
            if (
              this.asignacionIdContexto &&
              vehiculoData.asignacionId === this.asignacionIdContexto &&
              vehiculoData.nombreRutaSimulacion &&
              this.nombreRutaMostrada !== vehiculoData.nombreRutaSimulacion &&
              !this.nombreRutaMostrada?.includes('(Finalizada)')
            ) {
              this.nombreRutaMostrada = vehiculoData.nombreRutaSimulacion;
              this.cdr.detectChanges();
            }
          }
        });
      });
    this.subscriptions.add(vehicleUpdatedSub);

    const createSub = this.socketService
      .listen<Vehiculo>('vehicleCreated')
      .subscribe((vehiculo) => {
        if (
          !this.vehiculoIdParaSeguir ||
          (vehiculo.idVehi !== undefined &&
            vehiculo.idVehi === this.vehiculoIdParaSeguir)
        ) {
          console.log(
            '[Mapa] Evento Socket.IO [vehicleCreated] recibido:',
            vehiculo
          );
          this.zone.run(() => this.updateMarker(vehiculo));
        }
      });
    this.subscriptions.add(createSub);

    const deleteSub = this.socketService
      .listen<{ id: number }>('vehicleDeleted')
      .subscribe((data) => {
        if (
          !this.vehiculoIdParaSeguir ||
          data.id === this.vehiculoIdParaSeguir
        ) {
          console.log(
            '[Mapa] Evento Socket.IO [vehicleDeleted] recibido:',
            data
          );
          this.zone.run(() => this.removeMarker(data.id));
          if (data.id === this.vehiculoIdParaSeguir) {
            this.presentToast(
              'El vehículo que estabas siguiendo ha sido eliminado.',
              'warning'
            );
            this.clearTrackingAndReturnToList();
          }
        }
      });
    this.subscriptions.add(deleteSub);

    const simEndedSub = this.socketService
      .listen<any>('simulationEnded')
      .subscribe((data) => {
        if (
          this.asignacionIdContexto &&
          data.asignacionId === this.asignacionIdContexto
        ) {
          console.log(
            '[Mapa] Evento Socket.IO [simulationEnded] recibido:',
            data
          );
          this.presentToast(
            `Simulación para ${data.routeName || 'la ruta'} ha finalizado.`,
            'primary'
          );
          this.nombreRutaMostrada = `${data.routeName || 'Ruta'} (Finalizada)`;
          this.cdr.detectChanges();
        }
      });
    this.subscriptions.add(simEndedSub);

    const simErrorSub = this.socketService
      .listen<any>('simulationError')
      .subscribe((data) => {
        console.error(
          '[Mapa] Evento Socket.IO [simulationError] recibido:',
          data
        );
        this.presentToast(
          `Error en simulación: ${
            data.message ? data.message : 'Error desconocido'
          }`,
          'danger'
        );
      });
    this.subscriptions.add(simErrorSub);
  }

  private async dibujarRutaEnMapa(rutaId: number): Promise<void> {
    if (!this.map) {
      console.warn('[Mapa] dibujarRutaEnMapa: Mapa no inicializado.');
      return;
    }
    this.limpiarRutaAnteriorDelMapa();
    try {
      console.log(
        `[Mapa] dibujarRutaEnMapa: Cargando datos para ruta ID: ${rutaId}`
      );
      // CORRECCIÓN: Llamar a getRoute
      const rutaData = await this.apiService.getRoute(rutaId).toPromise();

      if (
        rutaData &&
        rutaData.puntosRuta &&
        Array.isArray(rutaData.puntosRuta) &&
        rutaData.puntosRuta.length > 0
      ) {
        const coordenadasLeaflet = rutaData.puntosRuta
          .map((p: any) =>
            Array.isArray(p) &&
            p.length === 2 &&
            typeof p[0] === 'number' &&
            typeof p[1] === 'number'
              ? [p[0], p[1]]
              : null
          )
          .filter((p) => p !== null) as L.LatLngExpression[]; // Filtrar nulos si la conversión falla

        if (coordenadasLeaflet.length > 0) {
          this.polylineRutaActual = L.polyline(coordenadasLeaflet, {
            color: 'blue',
            weight: 4,
            opacity: 0.7,
          }).addTo(this.map);
          this.map.fitBounds(this.polylineRutaActual.getBounds().pad(0.1));
          this.nombreRutaMostrada =
            rutaData.nombreRuta || `Ruta #${rutaData.idRuta}`; // Usar idRuta si está en la interfaz Route
          console.log(
            `[Mapa] Ruta "${this.nombreRutaMostrada}" (ID ${rutaId}) dibujada con ${coordenadasLeaflet.length} puntos.`
          );
        } else {
          this.nombreRutaMostrada = `${
            rutaData.nombreRuta || `Ruta ${rutaId}`
          } (Sin trazado válido)`;
          console.warn(
            `[Mapa] Coordenadas para ruta ID ${rutaId} están vacías después del filtrado/mapeo.`
          );
        }
      } else {
        this.nombreRutaMostrada = `Ruta ${rutaId} (No encontrada o sin puntos)`;
        console.warn(
          `[Mapa] No se pudo cargar el trazado para la ruta ID ${rutaId}. Respuesta API:`,
          rutaData
        );
      }
    } catch (error) {
      this.nombreRutaMostrada = `Ruta ${rutaId} (Error al cargar)`;
      console.error(
        `[Mapa] Error al obtener/dibujar la ruta ID ${rutaId}:`,
        error
      );
    }
    this.cdr.detectChanges();
  }

  private updateMarker(vehiculoData: VehiculoConDatosSimulacion): void {
    if (!this.map) {
      console.warn(
        `[Mapa] updateMarker: Mapa no está listo. Vehículo: ${
          vehiculoData.patente || vehiculoData.idVehi
        }`
      );
      return;
    }
    const { idVehi, latitud, longitud } = vehiculoData;
    if (idVehi === undefined || latitud == null || longitud == null) {
      console.warn(
        '[Mapa] updateMarker: Datos insuficientes (idVehi, latitud, longitud).',
        vehiculoData
      );
      return;
    }

    // Filtrar aquí también es importante
    if (
      this.vehiculoIdParaSeguir !== null &&
      idVehi !== this.vehiculoIdParaSeguir
    ) {
      // console.log(`[Mapa] updateMarker: Ignorando vehículo ${idVehi} porque se sigue a ${this.vehiculoIdParaSeguir}.`);
      return;
    }

    const position: L.LatLngTuple = [latitud, longitud];
    if (this.vehicleMarkers[idVehi]) {
      const marker = this.vehicleMarkers[idVehi];
      marker.setLatLng(position);
      marker.setPopupContent(this.createPopupContent(vehiculoData));
    } else {
      const newMarker = L.marker(position)
        .addTo(this.map)
        .bindPopup(this.createPopupContent(vehiculoData));
      this.vehicleMarkers[idVehi] = newMarker;
    }
  }

  private removeMarker(vehicleId: number): void {
    if (!this.map || !this.vehicleMarkers[vehicleId]) return;
    const marker = this.vehicleMarkers[vehicleId];
    if (this.map.hasLayer(marker)) {
      // Verificar si está en el mapa antes de remover
      this.map.removeLayer(marker);
    }
    delete this.vehicleMarkers[vehicleId];
    console.log(`[Mapa] Marcador para vehículo ID ${vehicleId} eliminado.`);
  }

  private createPopupContent(vehiculo: VehiculoConDatosSimulacion): string {
    const displayName =
      vehiculo.marca && vehiculo.modelo
        ? `${vehiculo.marca} ${vehiculo.modelo}`
        : vehiculo.patente || `Vehículo ${vehiculo.idVehi}`;
    const latStr =
      vehiculo.latitud != null ? vehiculo.latitud.toFixed(6) : 'N/A';
    const lonStr =
      vehiculo.longitud != null ? vehiculo.longitud.toFixed(6) : 'N/A';
    let html = `<b>${displayName}</b><br>`;
    if (vehiculo.patente) html += `Patente: ${vehiculo.patente}<br>`;
    if (vehiculo.estadoVehi)
      html += `Estado: ${
        vehiculo.estadoVehi.charAt(0).toUpperCase() +
        vehiculo.estadoVehi.slice(1)
      }<br>`;

    // Determinar el nombre de la ruta a mostrar en el popup
    let rutaEnPopup = '';
    if (
      this.nombreRutaMostrada &&
      this.polylineRutaActual &&
      vehiculo.idVehi === this.vehiculoIdParaSeguir
    ) {
      rutaEnPopup = this.nombreRutaMostrada;
    } else if (vehiculo.nombreRutaSimulacion) {
      rutaEnPopup = vehiculo.nombreRutaSimulacion + ' (Sim)';
    }
    if (rutaEnPopup) html += `Ruta: ${rutaEnPopup}<br>`;

    html += `<hr style="margin: 2px 0;">Lat: ${latStr}, Lon: ${lonStr}`;
    if (vehiculo.anio) html += `<br><small>Año: ${vehiculo.anio}</small>`;
    return html;
  }

  private fitMapToBounds(): void {
    if (!this.map || Object.keys(this.vehicleMarkers).length === 0) return;
    if (this.polylineRutaActual && this.vehiculoIdParaSeguir) return; // No ajustar si ya hay una ruta específica centrada
    const group = L.featureGroup(Object.values(this.vehicleMarkers));
    this.map.fitBounds(group.getBounds().pad(0.3));
  }

  centerOnTrackedVehicle() {
    if (
      this.vehiculoIdParaSeguir &&
      this.vehicleMarkers[this.vehiculoIdParaSeguir] &&
      this.map
    ) {
      const marker = this.vehicleMarkers[this.vehiculoIdParaSeguir];
      this.map.setView(
        marker.getLatLng(),
        this.map.getZoom() < 15 ? 15 : this.map.getZoom()
      );
    } else if (
      this.map &&
      Object.keys(this.vehicleMarkers).length > 0 &&
      !this.vehiculoIdParaSeguir
    ) {
      this.fitMapToBounds();
    } else {
      this.presentToast(
        'No hay vehículo específico para centrar o no hay marcadores.',
        'medium'
      );
    }
  }

  logout() {
    this.authService.logout();
  }

  clearTrackingAndReturnToList() {
    console.log(
      '[Mapa] Limpiando seguimiento y volviendo a la lista de asignaciones.'
    );
    if (this.asignacionIdContexto) {
      this.socketService.emit('unsubscribeFromAsignacion', {
        asignacionId: this.asignacionIdContexto,
      });
    }
    // No es necesario limpiar los queryParams aquí, la navegación lo hará
    this.router.navigate(['/asignacion-list']);
  }

  async presentToast(
    message: string,
    color: 'success' | 'warning' | 'danger' | 'primary' | 'medium' = 'medium',
    duration: number = 3000
  ) {
    const toast = await this.toastCtrl.create({
      message,
      duration,
      color,
      position: 'middle',
      mode: 'md',
    });
    toast.present();
  }

  ionViewDidLeave() {
    console.log(
      '[Mapa] ionViewDidLeave: Solicitando desuscripción del room si aplica.'
    );
    if (this.asignacionIdContexto) {
      this.socketService.emit('unsubscribeFromAsignacion', {
        asignacionId: this.asignacionIdContexto,
      });
    }
    // Las suscripciones principales (this.subscriptions) se limpian en ngOnDestroy o ionViewWillLeave
  }
}
