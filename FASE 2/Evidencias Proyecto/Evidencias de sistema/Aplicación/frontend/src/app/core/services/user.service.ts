import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, Usuario } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  
  constructor(private apiService: ApiService) {}
  
  /**
   * Obtiene todos los usuarios
   */
  getAllUsers(rol?: string): Observable<Usuario[]> {
    return this.apiService.getAllUsers(rol);
  }
  
  /**
   * Obtiene un usuario por ID
   */
  getUserById(id: number): Observable<Usuario> {
    return this.apiService.getUser(id);
  }
  
  /**
   * Crea un nuevo usuario
   */
  createUser(userData: Partial<Usuario> & { clave: string }): Observable<Usuario> {
    return this.apiService.createUser(userData);
  }
  
  /**
   * Actualiza un usuario existente
   */
  updateUser(id: number, userData: Partial<Usuario>): Observable<Usuario> {
    return this.apiService.updateUser(id, userData);
  }
  
  /**
   * Elimina un usuario
   */
  deleteUser(id: number): Observable<{ message: string }> {
    return this.apiService.deleteUser(id);
  }
  
  /**
   * Obtiene usuarios por rol
   */
  getUsersByRole(role: string): Observable<Usuario[]> {
    return this.apiService.getAllUsers(role);
  }
}
