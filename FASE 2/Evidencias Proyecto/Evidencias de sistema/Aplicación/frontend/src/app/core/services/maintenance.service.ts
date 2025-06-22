import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PlanificacionMantenimientoData, PlanificacionMantenimientoResumen } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class MaintenanceService {
  constructor(private apiService: ApiService) {}

  getPlanificaciones(): Observable<PlanificacionMantenimientoResumen[]> {
    return this.apiService.getPlanificaciones();
  }

  getPlanificacionById(id: number): Observable<PlanificacionMantenimientoResumen> {
    return this.apiService.getPlanificacionById(id);
  }
  createPlanificacion(plan: PlanificacionMantenimientoData): Observable<any> {
    return this.apiService.crearPlanificacion(plan);
  }
  updatePlanificacion(id: number, plan: Partial<PlanificacionMantenimientoData>): Observable<any> {
    return this.apiService.updatePlanificacion(id, plan);
  }

  deletePlanificacion(id: number): Observable<{ message: string }> {
    return this.apiService.deletePlanificacion(id);
  }

  generateOrdenTrabajo(planId: number, vehicleId: number, userId: number): Observable<any> {
    return this.apiService.generarOt(planId, vehicleId, userId);
  }

  getOrdenesTrabajo(): Observable<any[]> {
    return this.apiService.getOrdenesTrabajo();
  }
}
