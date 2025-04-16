import { Component } from '@angular/core';

import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  // styleUrl: 'app.component.scss', // Puedes mantener o quitar los estilos si no aplican
  standalone: true,
  imports: [
      IonApp,
      IonRouterOutlet,
      
  ],
})
export class AppComponent {
  
  constructor() {}
}