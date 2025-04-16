// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router'; 


export interface RegistrationData { /* ... como estaba ... */ }
export interface UserResponse { /* ... como estaba ... */ }


export interface LoginData {
  email: string;
  password?: string; // Opcional aquí si no lo usamos después
}

export interface LoginResponse {
  message: string;
  token: string;
  user: UserResponse; 
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8100/api/auth'; 

  

  private _isAuthenticated = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this._isAuthenticated.asObservable(); 

  private currentUser: UserResponse | null = null;


  constructor(
      private http: HttpClient,
      private router: Router 
    ) {
     
      this.loadUserFromToken();
    }

 
  register(userData: RegistrationData): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.apiUrl}/register`, userData)
      .pipe(catchError(this.handleError));
  }


  login(credentials: LoginData): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
         
          // 1. Guardar el token
          this.saveToken(response.token);
          // 2. Guardar la información del usuario
          this.currentUser = response.user; // Guardar info del usuario
          // 3. Actualizar el estado de autenticación
          this._isAuthenticated.next(true);
          console.log("Login exitoso, token guardado, estado actualizado.");
        }),
        catchError(this.handleError) 
      );
  }

 
  logout(): void {
    console.log("Cerrando sesión...");
    this.removeToken(); 
    this.currentUser = null; 
    this._isAuthenticated.next(false); 
   
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  // --- NUEVO: Métodos para Manejar Token ---
  private saveToken(token: string): void {
    localStorage.setItem('authToken', token); // Guardar en localStorage
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  private removeToken(): void {
    localStorage.removeItem('authToken');
  }

  // Verifica si hay un token (forma básica de ver si está "autenticado")
  // Podría mejorarse verificando la expiración del token
  private hasToken(): boolean {
    return !!localStorage.getItem('authToken');
  }

  // Método público para verificar autenticación (usado por AuthGuard)
  isAuthenticated(): boolean {
    return this._isAuthenticated.value; 
  }

  

  private loadUserFromToken(): void {
      const token = this.getToken();
      if (token) {
          // En una app real, aquí validarías el token contra el backend
          // o decodificarías el token para obtener la info del usuario
          // y verificar si ha expirado.
          // Por simplicidad ahora, solo actualizamos el estado si hay token.
          this._isAuthenticated.next(true);
          // Podríamos guardar/recuperar user info de localStorage también si quisiéramos persistirla
          // const userInfo = localStorage.getItem('currentUser');
          // if (userInfo) this.currentUser = JSON.parse(userInfo);
      }
  }

  
  getCurrentUser(): UserResponse | null {
  
    return this.currentUser;
  }

  
  private handleError(error: HttpErrorResponse) {
   
    let errorMessage = 'Ocurrió un error desconocido durante la autenticación.';
    let userFriendlyMessage = 'No se pudo completar la operación. Inténtalo de nuevo.';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
      userFriendlyMessage = 'Error de red o del navegador.';
    } else {
      errorMessage = `Error Código: ${error.status}\nMensaje: ${error.message}`;
      if (error.error && typeof error.error === 'object' && error.error.message) {
         errorMessage += `\nDetalle Backend: ${error.error.message}`;
         userFriendlyMessage = error.error.message;
      } else if (error.status === 401) { // Unauthorized (login incorrecto)
          userFriendlyMessage = 'Credenciales inválidas. Verifica tu email y contraseña.';
      } else if (error.status === 409) { // Conflict (registro email existe)
          userFriendlyMessage = 'El email proporcionado ya está registrado.';
      } else if (error.status === 400) { // Bad request (registro datos inválidos)
           userFriendlyMessage = 'Los datos proporcionados son inválidos.';
      }
    }
    console.error('Error en AuthService:', errorMessage);
    return throwError(() => new Error(userFriendlyMessage));
  }
}