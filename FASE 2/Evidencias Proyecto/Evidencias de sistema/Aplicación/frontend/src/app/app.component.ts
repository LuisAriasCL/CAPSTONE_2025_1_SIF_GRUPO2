import { Component } from '@angular/core';

import { 
  IonApp, 
  IonRouterOutlet, 
  IonSplitPane, 
  IonMenu, 
  IonContent 
} from '@ionic/angular/standalone';
import { HeaderComponent } from './componentes/header/header.component';
import { SidebarComponent } from './componentes/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrl: 'app.component.scss',
  standalone: true,
  imports: [
      IonApp,
      IonRouterOutlet,
      IonSplitPane,
      IonMenu,
      IonContent,
      HeaderComponent,
      SidebarComponent,
  ],
})
export class AppComponent {
  
  constructor() {}
}