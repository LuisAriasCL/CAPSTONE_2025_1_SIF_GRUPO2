// src/app/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';


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