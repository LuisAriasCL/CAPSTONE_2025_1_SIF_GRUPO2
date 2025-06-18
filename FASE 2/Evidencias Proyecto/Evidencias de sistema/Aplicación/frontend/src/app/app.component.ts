// src/app/app.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CommonModule } from '@angular/common'; // Necesario para directivas como *ngIf si es standalone

// Módulos de Ionic necesarios para el template de app.component.html
import {
  IonApp,
  IonSplitPane,
  IonMenu,
  IonContent,
  IonRouterOutlet,
} from '@ionic/angular/standalone';
import { HeaderComponent } from './componentes/header/header.component'; // Importa tu HeaderComponent
import { SidebarComponent } from './componentes/sidebar/sidebar.component'; // Importa tu SidebarComponent

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
 
  shouldShowSidebar$: Observable<boolean> | undefined;

  constructor() {}

  ngOnInit() {
  
    this.shouldShowSidebar$ = this.authService.currentUser$.pipe(
      map(user => {
        return !user || (user.rol !== 'tecnico' && user.rol !== 'conductor');
      })
    );
  }
}
