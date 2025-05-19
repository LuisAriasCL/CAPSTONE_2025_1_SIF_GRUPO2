import { Component } from '@angular/core';

import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { HeaderComponent } from './componentes/header/header.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  // styleUrl: 'app.component.scss', // Puedes mantener o quitar los estilos si no aplican
  standalone: true,
  imports: [
      IonApp,
      IonRouterOutlet,
      HeaderComponent,
  ],
})
export class AppComponent {
  
  constructor() {}
}