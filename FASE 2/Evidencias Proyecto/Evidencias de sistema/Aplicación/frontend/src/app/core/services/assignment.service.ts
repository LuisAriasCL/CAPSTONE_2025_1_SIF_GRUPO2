import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, AsignacionRecorridoData, AsignacionRecorrido, Route as RutaPlantilla, VehiculoAsignacionInfo, UsuarioConductorInfo } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class AssignmentService {
  
  constructor(private apiService: ApiService) {}
  
  /**
   * Obtiene todas las asignaciones de recorrido
   */
  getAllAssignments(filtros?: any): Observable<AsignacionRecorrido[]> {
    return this.apiService.getAsignacionesRecorrido(filtros);
  }
  
  /**
   * Obtiene una asignación por ID
   */
  getAssignmentById(id: number): Observable<AsignacionRecorrido> {
    return this.apiService.getAsignacionRecorrido(id);
  }
  
  /**
   * Crea una nueva asignación
   */
  createAssignment(assignmentData: AsignacionRecorridoData): Observable<AsignacionRecorrido> {
    return this.apiService.createAsignacionRecorrido(assignmentData);
  }
  
  /**
   * Actualiza una asignación existente
   */
  updateAssignment(id: number, assignmentData: Partial<AsignacionRecorridoData>): Observable<any> {
    return this.apiService.updateAsignacionRecorrido(id, assignmentData);
  }
  
  /**
   * Elimina una asignación
   */
  deleteAssignment(id: number): Observable<any> {
    return this.apiService.deleteAsignacionRecorrido(id);
  }
  
  /**
   * Obtiene las rutas disponibles
   */
  getRoutes(): Observable<RutaPlantilla[]> {
    return this.apiService.getRoutes();
  }
    /**
   * Obtiene los vehículos disponibles para asignación
   */
  getAvailableVehicles(): Observable<VehiculoAsignacionInfo[]> {
    return this.apiService.getVehiculosDisponibles();
  }
  
  /**
   * Obtiene los conductores disponibles
   */
  getAvailableDrivers(): Observable<UsuarioConductorInfo[]> {
    return this.apiService.getUsuarios();
  }
}
