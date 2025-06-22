// src/app/app.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { Observable, combineLatest, startWith } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common'; // Necesario para directivas como *ngIf si es standalone
import { Router, NavigationEnd } from '@angular/router';

// Módulos de Ionic necesarios para el template de app.component.html
import {
  IonApp,
  IonSplitPane,
  IonMenu,
  IonContent,
  IonRouterOutlet,
} from '@ionic/angular/standalone';
import { HeaderComponent } from './shared/components/header/header.component'; // Importa tu HeaderComponent
import { SidebarComponent } from './shared/components/sidebar/sidebar.component'; // Importa tu SidebarComponent

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true, // Asumiendo que tu app.component es standalone
  imports: [
    CommonModule,
    IonApp,
    IonSplitPane,
    IonMenu,
    IonContent,
    IonRouterOutlet,
    HeaderComponent, 
    SidebarComponent 
  ]
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
 
  shouldShowSidebar$: Observable<boolean> | undefined;
  shouldShowHeader$: Observable<boolean> | undefined;
  currentUrl$: Observable<string> | undefined;

  constructor() {}

  ngOnInit() {    // Observable para detectar cambios de ruta
    this.currentUrl$ = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(event => (event as NavigationEnd).url),
      startWith(this.router.url) // Incluir la URL inicial
    );

    // Observable para mostrar/ocultar sidebar
    this.shouldShowSidebar$ = combineLatest([
      this.authService.currentUser$,
      this.currentUrl$
    ]).pipe(
      map(([user, url]) => {
        // Ocultar sidebar si no hay usuario autenticado, si es técnico/conductor, o si está en login/register
        const isAuthPage = url === '/login' || url === '/register';
        const shouldHideForRole = user && (user.rol === 'tecnico' || user.rol === 'conductor');
        
        return !isAuthPage && !!user && !shouldHideForRole;
      })
    );

    // Observable para mostrar/ocultar header
    this.shouldShowHeader$ = this.currentUrl$.pipe(
      map(url => {
        // Ocultar header solo en páginas de login y register
        return url !== '/login' && url !== '/register';
      })
    );
  }
}
