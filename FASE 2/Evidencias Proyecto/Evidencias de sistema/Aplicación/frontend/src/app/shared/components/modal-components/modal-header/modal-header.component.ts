import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-modal-header',
  template: `
    <ion-header>
      <ion-toolbar [color]="color">
        <ion-title>{{ title }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="onClose()">
            <ion-icon slot="icon-only" name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
  `,
  styles: [],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class ModalHeaderComponent {
  @Input() title: string = '';
  @Input() color: string = 'primary';
  @Output() close = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }
}
