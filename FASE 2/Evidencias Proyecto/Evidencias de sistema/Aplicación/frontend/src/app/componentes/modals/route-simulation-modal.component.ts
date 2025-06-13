import { Component, Input } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import * as L from 'leaflet';

@Component({
  selector: 'app-route-simulation-modal',
  standalone: true,
  imports: [IonicModule],
  template: ``,
})
export class RouteSimulationModalComponent {
  @Input() routeName?: string;
  @Input() routePoints?: L.LatLngTuple[];
  @Input() distance?: number;
  @Input() duration?: number;

  constructor(private modalCtrl: ModalController) {}

  close() {
    this.modalCtrl.dismiss();
  }
}
