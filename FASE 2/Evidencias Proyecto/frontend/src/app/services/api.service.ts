// src/app/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs'; // Asegúrate de importar 'of' de rxjs
import { map } from 'rxjs/operators';

export interface Route {
  id: number;
  nombre: string;
  descripcion: string | null;
  puntos: Array<[number, number]>; // Array de tuplas [lat, lon]
  createdAt?: string;
  updatedAt?: string;
}
export interface Vehicle {
  id: number;
  name: string;
  plate: string;
  latitude: number;
  longitude: number;
  status: 'active' | 'inactive' | 'maintenance'; 
  createdAt?: string; 
  updatedAt?: string; 
}

@Injectable({
  providedIn: 'root' 
})
export class ApiService {
 
  private apiUrl = 'http://localhost:8100/api';

  
  constructor(private http: HttpClient) { }

  // Métodos CRUD 
  getRoutePath(start: L.LatLngTuple, end: L.LatLngTuple): Observable<L.LatLngTuple[] | null> {
    const lonLatStart = `${start[1]},${start[0]}`; // Invertir a Lon, Lat
  const lonLatEnd = `${end[1]},${end[0]}`;     // Invertir a Lon, Lat

  // --- URL CORREGIDA usando backticks y ${} ---
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${lonLatStart};${lonLatEnd}?overview=full&geometries=geojson`;
  // --- FIN CORRECCIÓN ---
    console.log("Llamando a OSRM:", osrmUrl);
    return this.http.get<any>(osrmUrl)
      .pipe(
        map(response => {
          if (response?.routes?.[0]?.geometry?.coordinates) {
            const coordinates = response.routes[0].geometry.coordinates;
            const latLngPoints: L.LatLngTuple[] = coordinates.map((coord: [number, number]) => [coord[1], coord[0]]); // Invertir a [lat, lon]
            console.log(`Ruta OSRM recibida con ${latLngPoints.length} puntos.`);
            return latLngPoints;
          } else {
            console.error("Respuesta inválida de OSRM:", response);
            return null;
          }
        }),
        catchError(error => {
           console.error('Error en la llamada a OSRM:', error);
           return of(null); // Devuelve observable con null
        })
      );
  }
  // GET /api/rutas
  getRoutes(): Observable<Route[]> {
    return this.http.get<Route[]>(`${this.apiUrl}/rutas`) // <-- URL en español
      .pipe(catchError(this.handleError));
  }

  // GET /api/rutas/:id (Lo necesitaremos para editar)
  getRoute(id: number): Observable<Route> {
    return this.http.get<Route>(`${this.apiUrl}/rutas/${id}`)
       .pipe(catchError(this.handleError));
  }

  // POST /api/rutas (Lo necesitaremos para crear)
  createRoute(routeData: Partial<Route>): Observable<Route> {
     // Asegurarse de enviar los campos correctos (nombre, puntos, descripcion?)
    return this.http.post<Route>(`${this.apiUrl}/rutas`, routeData)
       .pipe(catchError(this.handleError));
  }

  updateRoute(id: number, routeData: Partial<Route>): Observable<Route> {
    // CORREGIDO:
    return this.http.put<Route>(`${this.apiUrl}/rutas/${id}`, routeData)
       .pipe(catchError(this.handleError));
  }
 
  // DELETE /api/rutas/:id (Este ya estaba bien en tu último código)
  deleteRoute(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/rutas/${id}`)
      .pipe(catchError(this.handleError));
  }
 
  getVehicles(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(`${this.apiUrl}/vehicles`)
      .pipe(catchError(this.handleError)); // Manejo de errores
  }

  
  getVehicle(id: number): Observable<Vehicle> {
    return this.http.get<Vehicle>(`<span class="math-inline">\{this\.apiUrl\}/vehicles/</span>{id}`)
      .pipe(catchError(this.handleError));
  }

  
  createVehicle(vehicleData: Partial<Vehicle>): Observable<Vehicle> {
    return this.http.post<Vehicle>(`${this.apiUrl}/vehicles`, vehicleData)
      .pipe(catchError(this.handleError));
  }

  
  updateVehicle(id: number, vehicleData: Partial<Vehicle>): Observable<Vehicle> {
    return this.http.put<Vehicle>(`<span class="math-inline">\{this\.apiUrl\}/vehicles/</span>{id}`, vehicleData)
      .pipe(catchError(this.handleError));
  }


  deleteVehicle(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`<span class="math-inline">\{this\.apiUrl\}/vehicles/</span>{id}`)
      .pipe(catchError(this.handleError));
  }

  // --- Manejador de Errores HTTP Básico ---
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error desconocido.';
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente o de red
      errorMessage = `Error: ${error.error.message}`;
    } else {
      
      errorMessage = `Error Código: ${error.status}\nMensaje: ${error.message}`;
      if (error.error && typeof error.error === 'object' && error.error.message) {
        errorMessage += `\nDetalle: ${error.error.message}`; 
      }
    }
    console.error(errorMessage);
    
    return throwError(() => new Error(errorMessage));
  }
}