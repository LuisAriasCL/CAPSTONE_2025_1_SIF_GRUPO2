// src/app/services/api.service.ts (EDITADO)
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs'; // 'of' ya estaba importado, lo mantenemos
import { map } from 'rxjs/operators'; // 'map' ya estaba importado, lo mantenemos

// --- Definición de Interfaces ---

// Interfaz para Route (se mantiene como estaba en tu archivo)
export interface Route {
  id: number;
  nombre: string;
  descripcion: string | null;
  puntos: Array<[number, number]>; // Array de tuplas [lat, lon]
  
}

// La interfaz 'Vehicle' antigua se elimina o se reemplaza.
// RECOMENDACIÓN: Crear un nuevo archivo para la interfaz Vehiculo, por ejemplo:
// src/app/interfaces/vehiculo.interface.ts
// Y luego importarla aquí: import { Vehiculo, EstadoVehiculo, TipoCombustibleVehiculo } from '../interfaces/vehiculo.interface.ts';

// Por ahora, para que este archivo funcione y puedas ver los cambios,
// definiré la nueva estructura de Vehiculo y sus tipos asociados aquí mismo.
// ¡Pero es mejor moverlos a su propio archivo `vehiculo.interface.ts`!

export type EstadoVehiculo = 'activo' | 'inactivo' | 'mantenimiento' | 'taller';
export type TipoCombustibleVehiculo = 'gasolina_93' | 'gasolina_95' | 'gasolina_97' | 'diesel' | 'electrico' | 'otro';

export interface Vehiculo { // Esta es la NUEVA estructura que usaremos
  idVehi?: number; // PK del backend, opcional al crear
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
  fecAdqui: string; // Formato AAAA-MM-DD
  latitud?: number | null;
  longitud?: number | null;
  // Nota: Los campos createdAt y updatedAt se omiten si timestamps: false en el backend para Vehiculo
}

// La interfaz 'Vehicle' original de tu archivo ya no se usará para los nuevos métodos.
// export interface Vehicle {
//   id: number;
//   name: string;
//   plate: string;
//   // ... otros campos antiguos
// }


@Injectable({
  providedIn: 'root'
})
export class ApiService {

  // private apiUrl = 'http://localhost:8100/api'; // Ya lo tenías así.
  // Si usas environment.ts (como en mi propuesta anterior), sería:
  // import { environment } from '../../environments/environment';
  // private apiUrl = environment.apiUrl;
  // Por ahora, mantendré tu definición directa:
  private apiUrl = 'http://localhost:8101/api';


  constructor(private http: HttpClient) { }

  // --- Métodos para Rutas (se mantienen como estaban en tu archivo) ---
  getRoutePath(start: L.LatLngTuple, end: L.LatLngTuple): Observable<L.LatLngTuple[] | null> {
    const lonLatStart = `${start[1]},${start[0]}`;
    const lonLatEnd = `${end[1]},${end[0]}`;
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${lonLatStart};${lonLatEnd}?overview=full&geometries=geojson`;
    console.log("Llamando a OSRM:", osrmUrl);
    return this.http.get<any>(osrmUrl)
      .pipe(
        map(response => {
          if (response?.routes?.[0]?.geometry?.coordinates) {
            const coordinates = response.routes[0].geometry.coordinates;
            const latLngPoints: L.LatLngTuple[] = coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
            console.log(`Ruta OSRM recibida con ${latLngPoints.length} puntos.`);
            return latLngPoints;
          } else {
            console.error("Respuesta inválida de OSRM:", response);
            return null;
          }
        }),
        catchError(error => {
           console.error('Error en la llamada a OSRM:', error);
           return of(null);
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

  // --- Métodos CRUD para Vehículos (MODIFICADOS) ---

  /**
   * Obtener todos los vehículos.
   * La respuesta del backend ahora es un array de objetos Vehiculo (con atributos en camelCase español).
   */
  getVehicles(): Observable<Vehiculo[]> { // <--- Tipo de retorno actualizado
    return this.http.get<Vehiculo[]>(`${this.apiUrl}/vehicles`) // Endpoint se mantiene
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtener un vehículo por su ID.
   * La respuesta del backend ahora es un objeto Vehiculo.
   */
  getVehicle(id: number): Observable<Vehiculo> { // <--- Tipo de retorno actualizado (tu método se llama getVehicle)
    return this.http.get<Vehiculo>(`${this.apiUrl}/vehicles/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Crear un nuevo vehículo.
   * @param vehicleData Objeto que cumple con la interfaz Vehiculo (atributos en camelCase español).
   * Ej: { patente: '...', marca: '...', fecAdqui: 'YYYY-MM-DD', kmVehi: 0, ... }
   */
  createVehicle(vehicleData: Vehiculo): Observable<Vehiculo> { // <--- Tipo de payload y retorno actualizados
    // El backend ahora espera los campos con nombres en español definidos en el modelo Vehiculo.js
    // (ej. patente, kmVehi, fecAdqui, estadoVehi, etc.)
    return this.http.post<Vehiculo>(`${this.apiUrl}/vehicles`, vehicleData)
      .pipe(catchError(this.handleError));
  }

  /**
   * Actualizar un vehículo existente.
   * @param id ID del vehículo a actualizar.
   * @param vehicleData Objeto con los campos a actualizar (atributos en camelCase español).
   * Ej: { kmVehi: 150000, estadoVehi: 'mantenimiento' }
   */
  updateVehicle(id: number, vehicleData: Partial<Vehiculo>): Observable<Vehiculo> { // <--- Tipo de payload y retorno actualizados
    // El backend ahora espera los campos con nombres en español en vehicleData.
    return this.http.put<Vehiculo>(`${this.apiUrl}/vehicles/${id}`, vehicleData)
      .pipe(catchError(this.handleError));
  }

  /**
   * Eliminar un vehículo.
   * La respuesta del backend refactorizado es: { message: 'Vehículo eliminado exitosamente.' }
   */
  deleteVehicle(id: number): Observable<{ message: string }> { // Tipo de respuesta se mantiene
    return this.http.delete<{ message: string }>(`${this.apiUrl}/vehicles/${id}`)
      .pipe(catchError(this.handleError));
  }

  // --- Manejador de Errores HTTP Básico (se mantiene como estaba en tu archivo) ---
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error desconocido.';
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente o de red
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // El backend retornó un código de error
      errorMessage = `Error Código: ${error.status}\nMensaje: ${error.message}`;
      if (error.error && typeof error.error === 'object' && error.error.message) {
        errorMessage += `\nDetalle: ${error.error.message}`;
      } else if (error.error && typeof error.error === 'string') { // Añadido para errores de string plano
        errorMessage += `\nDetalle: ${error.error}`;
      }
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage)); // Retorna un Observable de error
  }
}