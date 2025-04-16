import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router'; 
import { IonSplitPane, IonMenu, IonContent, IonList, IonNote, IonMenuToggle, IonItem, IonIcon, IonLabel, IonRouterOutlet, IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton } from '@ionic/angular/standalone';
import { IonButton } from '@ionic/angular';

@Component({
  selector: 'app-header', 
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [IonButtons, 
    CommonModule, IonHeader, IonToolbar, IonTitle,IonMenuButton], 
})

export class HeaderComponent {
  constructor() {}
  ngOnInit() {}
}
