import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-incidente-movil',
  templateUrl: './incidente-movil.page.html',
  styleUrls: ['./incidente-movil.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class IncidenteMovilPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
