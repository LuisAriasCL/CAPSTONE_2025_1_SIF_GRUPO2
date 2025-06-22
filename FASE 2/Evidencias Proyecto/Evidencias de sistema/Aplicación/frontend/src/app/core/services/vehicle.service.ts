import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, Vehiculo } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class VehicleService {
  constructor(private apiService: ApiService) {}

  getVehicles(): Observable<Vehiculo[]> {
    return this.apiService.getVehicles();
  }

  getVehicleById(id: number): Observable<Vehiculo> {
    return this.apiService.getVehicle(id);
  }
  createVehicle(vehicle: Vehiculo): Observable<Vehiculo> {
    return this.apiService.createVehicle(vehicle);
  }

  updateVehicle(id: number, vehicle: Partial<Vehiculo>): Observable<Vehiculo> {
    return this.apiService.updateVehicle(id, vehicle);
  }

  deleteVehicle(id: number): Observable<{ message: string }> {
    return this.apiService.deleteVehicle(id);
  }

  // Métodos auxiliares para obtener historiales
  getCombustibleHistory(vehicleId: number): Observable<any[]> {
    // Por ahora retornamos un observable vacío, se puede implementar más tarde
    return new Observable(observer => observer.next([]));
  }

  getSiniestrosHistory(vehicleId: number): Observable<any[]> {
    return this.apiService.getSiniestros();
  }
}
