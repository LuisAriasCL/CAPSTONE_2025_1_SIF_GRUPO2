// src/app/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import * as L from 'leaflet'; // Importa L si usas L.LatLngTuple en la interfaz de respuesta

// --- Definición de Interfaces ---

// NUEVA INTERFAZ para la respuesta de getRoutePath
export interface OsrmRouteData {
  points: L.LatLngTuple[];
  distance: number; // Distancia en metros
  duration: number; // Duración en segundos
}

export interface Route {
  idRuta: number;
  nombreRuta: string;
  descripcionRuta: string | null;
  puntosRuta: Array<[number, number]>;
  kilometrosRuta?: number | null;
}

// ... (tus otras interfaces como Vehiculo, etc., pueden permanecer aquí) ...
export type EstadoVehiculo = 'activo' | 'inactivo' | 'mantenimiento' | 'taller';
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

  private apiUrl = 'http://localhost:8100/api';

  constructor(private http: HttpClient) { }

  // --- Métodos para Rutas ---
  // MODIFICADO para devolver un objeto OsrmRouteData o null
  getRoutePath(start: L.LatLngTuple, end: L.LatLngTuple): Observable<OsrmRouteData | null> {
    const lonLatStart = `${start[1]},${start[0]}`;
    const lonLatEnd = `${end[1]},${end[0]}`;
    // overview=full para la geometría completa, geometries=geojson para el formato
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${lonLatStart};${lonLatEnd}?overview=full&geometries=geojson`;
    console.log("Llamando a OSRM:", osrmUrl);

    return this.http.get<any>(osrmUrl).pipe(
      map(response => {
        // Verificar si existe la ruta y la geometría
        if (response?.routes?.[0]?.geometry?.coordinates &&
            typeof response.routes[0].distance === 'number' &&
            typeof response.routes[0].duration === 'number') {

          const routeLeg = response.routes[0]; // La primera (y usualmente única) ruta/tramo
          const coordinates = routeLeg.geometry.coordinates;
          const distanceInMeters = routeLeg.distance; // Distancia en metros
          const durationInSeconds = routeLeg.duration; // Duración en segundos

          const latLngPoints: L.LatLngTuple[] = coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);

          console.log(`Ruta OSRM recibida: ${latLngPoints.length} puntos, Distancia: ${distanceInMeters}m, Duración: ${durationInSeconds}s.`);
          return {
            points: latLngPoints,
            distance: distanceInMeters,
            duration: durationInSeconds
          };
        } else {
          console.error("Respuesta inválida de OSRM o datos de ruta incompletos:", response);
          return null; // Devuelve null si la respuesta no es la esperada
        }
      }),
      catchError(error => {
        console.error('Error en la llamada a OSRM:', error);
        return of(null); // Devuelve null en caso de error HTTP
      })
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
  getVehicles(): Observable<Vehiculo[]> {
    return this.http.get<Vehiculo[]>(`${this.apiUrl}/vehicles`)
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

  // --- Manejador de Errores HTTP ---
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error desconocido.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error Código: ${error.status}\nMensaje: ${error.message}`;
      if (error.error && typeof error.error === 'object' && error.error.message) {
        errorMessage += `\nDetalle: ${error.error.message}`;
      } else if (error.error && typeof error.error === 'string') {
        errorMessage += `\nDetalle: ${error.error}`;
      }
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}