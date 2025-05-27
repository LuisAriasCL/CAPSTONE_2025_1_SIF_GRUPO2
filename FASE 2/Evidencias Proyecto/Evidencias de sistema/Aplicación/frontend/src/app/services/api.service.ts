// src/app/services/api.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import * as L from 'leaflet';

// --- INTERFACES ---

// Interfaz para la respuesta de OSRM (como la definimos antes)
export interface OsrmRouteData {
  points: L.LatLngTuple[];
  distance: number; // Distancia en metros
  duration: number; // Duración en segundos
}

// Interfaz para RUTA (plantilla)
export interface Route {
  idRuta: number;
  nombreRuta: string;
  descripcionRuta: string | null;
  puntosRuta: Array<[number, number]>;
  kilometrosRuta?: number | null;
}

// Interfaz para VEHICULO (simplificada para el contexto de asignación)
export interface VehiculoAsignacionInfo {
  idVehi: number;
  patente: string;
  modelo?: string;
  marca?: string;
  // otros campos que quieras mostrar en los selectores o listas
}

// Interfaz para USUARIO (conductor, simplificada)
export interface UsuarioConductorInfo {
  idUsu: number;
  priNomUsu: string;
  priApeUsu: string;
  email?: string;
  // otros campos útiles
}

// NUEVA INTERFAZ: ASIGNACION_RECORRIDO
// Refleja la estructura que el backend devuelve, incluyendo datos de las relaciones
export interface AsignacionRecorrido {
  idAsig: number;
  estadoAsig: 'pendiente' | 'asignado' | 'en_progreso' | 'completado' | 'cancelado';
  fecCreAsig: string; // o Date, dependiendo de cómo lo manejes
  fecIniRecor: string; // o Date
  fecFinRecor?: string | null; // o Date
  efiCombRecor?: number | null;
  kmIniRecor: number;
  kmFinRecor?: number | null;
  notas?: string | null;
  vehiculoIdVehi: number;
  usuarioIdUsu: number;
  rutaIdRuta: number;

  // Propiedades de las relaciones (incluidas desde el backend)
  vehiculo?: VehiculoAsignacionInfo;
  conductor?: UsuarioConductorInfo;
  rutaPlantilla?: Route; // Usamos la interfaz Route existente para la plantilla
}

// Interfaz para los datos al CREAR o ACTUALIZAR una asignación
// No incluye los objetos completos de vehiculo, conductor, rutaPlantilla, solo sus IDs
export interface AsignacionRecorridoData {
  fecIniRecor: string; // Formato YYYY-MM-DDTHH:mm:ss
  fecFinRecor?: string | null;
  kmIniRecor?: number; // Puede ser opcional si el backend lo toma del vehículo
  kmFinRecor?: number | null;
  notas?: string | null;
  vehiculoIdVehi: number;
  usuarioIdUsu: number; // ID del conductor
  rutaIdRuta: number;
  estadoAsig?: 'pendiente' | 'asignado' | 'en_progreso' | 'completado' | 'cancelado';
  efiCombRecor?: number | null;
}

// ... (tus interfaces Vehiculo completa, EstadoVehiculo, TipoCombustibleVehiculo pueden seguir aquí)
export type EstadoVehiculo = 'activo' | 'inactivo' | 'mantenimiento' | 'taller' | 'baja';
export type TipoCombustibleVehiculo = 'gasolina_93' | 'gasolina_95' | 'gasolina_97' | 'diesel' | 'electrico' | 'otro';

export interface Vehiculo {
  idVehi?: number;
  patente: string;
  chasis: string;
  tipoVehi?: string | null;
  estadoVehi: EstadoVehiculo;
  tipoCombVehi?: TipoCombustibleVehiculo | null;
  kmVehi: number;
  marca: string;
  modelo: string;
  anio: number;
  kmVidaUtil?: number | null;
  efiComb?: number | null;
  fecAdqui: string;
  latitud?: number | null;
  longitud?: number | null;
}


@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:8100/api'; // URL base de API

  private http = inject(HttpClient);

  constructor() { }

  // --- Métodos para Rutas (plantillas) ---
  getRoutePath(start: L.LatLngTuple, end: L.LatLngTuple): Observable<OsrmRouteData | null> {
    const lonLatStart = `${start[1]},${start[0]}`;
    const lonLatEnd = `${end[1]},${end[0]}`;
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${lonLatStart};${lonLatEnd}?overview=full&geometries=geojson`;
    return this.http.get<any>(osrmUrl).pipe(
      map(response => {
        if (response?.routes?.[0]?.geometry?.coordinates &&
            typeof response.routes[0].distance === 'number' &&
            typeof response.routes[0].duration === 'number') {
          const routeLeg = response.routes[0];
          const coordinates = routeLeg.geometry.coordinates;
          const distanceInMeters = routeLeg.distance;
          const durationInSeconds = routeLeg.duration;
          const latLngPoints: L.LatLngTuple[] = coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
          return { points: latLngPoints, distance: distanceInMeters, duration: durationInSeconds };
        }
        return null;
      }),
      catchError(this.handleErrorSimple) // Usar un manejador de error más simple para OSRM
    );
  }

  getRoutes(): Observable<Route[]> {
    return this.http.get<Route[]>(`${this.apiUrl}/rutas`)
      .pipe(catchError(this.handleError));
  }

  getRoute(id: number): Observable<Route> {
    return this.http.get<Route>(`${this.apiUrl}/rutas/${id}`)
       .pipe(catchError(this.handleError));
  }

  createRoute(routeData: Partial<Route>): Observable<Route> {
    return this.http.post<Route>(`${this.apiUrl}/rutas`, routeData)
       .pipe(catchError(this.handleError));
  }

  updateRoute(id: number, routeData: Partial<Route>): Observable<Route> {
    return this.http.put<Route>(`${this.apiUrl}/rutas/${id}`, routeData)
       .pipe(catchError(this.handleError));
  }

  deleteRoute(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/rutas/${id}`)
      .pipe(catchError(this.handleError));
  }

  // --- Métodos CRUD para Vehículos ---
  getVehicles(params?: { estado?: EstadoVehiculo, tipo?: string }): Observable<Vehiculo[]> {
    let httpParams = new HttpParams();
    if (params?.estado) {
      httpParams = httpParams.set('estado', params.estado);
    }
    if (params?.tipo) {
      httpParams = httpParams.set('tipo', params.tipo);
    }
    return this.http.get<Vehiculo[]>(`${this.apiUrl}/vehicles`, { params: httpParams })
      .pipe(catchError(this.handleError));
  }

  getVehicle(id: number): Observable<Vehiculo> {
    return this.http.get<Vehiculo>(`${this.apiUrl}/vehicles/${id}`)
      .pipe(catchError(this.handleError));
  }

  createVehicle(vehicleData: Vehiculo): Observable<Vehiculo> {
    return this.http.post<Vehiculo>(`${this.apiUrl}/vehicles`, vehicleData)
      .pipe(catchError(this.handleError));
  }

  updateVehicle(id: number, vehicleData: Partial<Vehiculo>): Observable<Vehiculo> {
    return this.http.put<Vehiculo>(`${this.apiUrl}/vehicles/${id}`, vehicleData)
      .pipe(catchError(this.handleError));
  }

  deleteVehicle(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/vehicles/${id}`)
      .pipe(catchError(this.handleError));
  }

  // --- NUEVOS Métodos para Asignaciones de Recorrido ---
  getAsignacionesRecorrido(filtros?: any): Observable<AsignacionRecorrido[]> {
    let params = new HttpParams();
    if (filtros) {
      Object.keys(filtros).forEach(key => {
        if (filtros[key] !== null && filtros[key] !== undefined) {
          params = params.set(key, filtros[key]);
        }
      });
    }
    return this.http.get<AsignacionRecorrido[]>(`${this.apiUrl}/asignaciones-recorrido`, { params })
      .pipe(catchError(this.handleError));
  }

  getAsignacionRecorrido(idAsig: number): Observable<AsignacionRecorrido> {
    return this.http.get<AsignacionRecorrido>(`${this.apiUrl}/asignaciones-recorrido/${idAsig}`)
      .pipe(catchError(this.handleError));
  }

  createAsignacionRecorrido(data: AsignacionRecorridoData): Observable<AsignacionRecorrido> {
    return this.http.post<AsignacionRecorrido>(`${this.apiUrl}/asignaciones-recorrido`, data)
      .pipe(catchError(this.handleError));
  }

  updateAsignacionRecorrido(idAsig: number, data: Partial<AsignacionRecorridoData>): Observable<AsignacionRecorrido> {
    return this.http.put<AsignacionRecorrido>(`${this.apiUrl}/asignaciones-recorrido/${idAsig}`, data)
      .pipe(catchError(this.handleError));
  }

  deleteAsignacionRecorrido(idAsig: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/asignaciones-recorrido/${idAsig}`)
      .pipe(catchError(this.handleError));
  }

  // --- Métodos para Usuarios (ejemplo, necesitarás más para roles, etc.) ---
  getUsuarios(params?: { rol?: string }): Observable<UsuarioConductorInfo[]> { // Devuelve la interfaz simplificada
    let httpParams = new HttpParams();
    if (params?.rol) {
      httpParams = httpParams.set('rol', params.rol);
    }
    // Asume que tienes un endpoint /api/usuarios que puede filtrar por rol
    return this.http.get<UsuarioConductorInfo[]>(`${this.apiUrl}/auth/users`, { params: httpParams })
      .pipe(catchError(this.handleError));
  }


  // --- Manejador de Errores ---
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error desconocido.';
    let userFriendlyMessage = 'No se pudo completar la operación. Inténtalo de nuevo.';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error del cliente o de red: ${error.error.message}`;
      userFriendlyMessage = 'Error de red o del navegador. Por favor, revisa tu conexión.';
    } else {
      errorMessage = `Error del Servidor Código: ${error.status}\nMensaje: ${error.message}`;
      if (error.error && typeof error.error === 'object' && error.error.message) {
         errorMessage += `\nDetalle Backend: ${error.error.message}`;
         userFriendlyMessage = error.error.message;
      } else if (error.error && typeof error.error === 'string' && error.error.length < 200) { // Si es un string simple
         errorMessage += `\nDetalle Backend: ${error.error}`;
         userFriendlyMessage = error.error;
      } else if (error.status === 400) {
        userFriendlyMessage = 'Solicitud incorrecta. Revisa los datos enviados.';
      } else if (error.status === 401) {
        userFriendlyMessage = 'No autorizado. Por favor, inicia sesión de nuevo.';
      } else if (error.status === 403) {
        userFriendlyMessage = 'Acceso prohibido. No tienes permisos para esta acción.';
      } else if (error.status === 404) {
        userFriendlyMessage = 'El recurso solicitado no fue encontrado en el servidor.';
      } else if (error.status === 500) {
        userFriendlyMessage = 'Error interno del servidor. Inténtalo más tarde.';
      }
    }
    console.error('Error en ApiService:', errorMessage, error);
    // En lugar de solo el mensaje, podrías devolver un objeto con más info del error
    return throwError(() => ({ message: userFriendlyMessage, status: error.status, errorContent: error.error }));
  }

  private handleErrorSimple(error: HttpErrorResponse) { // Para OSRM o servicios externos
    console.error('Error en servicio externo:', error.message || error);
    return of(null); // Devuelve un observable que emite null y completa
  }
}
