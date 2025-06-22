import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-modal-footer',
  template: `
    <div class="ion-padding">
      <ion-button
        [type]="submitType"
        expand="block"
        [color]="submitColor"
        [disabled]="isDisabled"
        (click)="onSubmit()"
      >
        <ion-icon *ngIf="icon" slot="start" [name]="icon"></ion-icon>
        {{ submitLabel }}
      </ion-button>
      
      <ion-button
        *ngIf="showCancel"
        expand="block"
        fill="outline"
        color="medium"
        class="ion-margin-top"
        (click)="onCancel()"
      >
        <ion-icon *ngIf="cancelIcon" slot="start" [name]="cancelIcon"></ion-icon>
        {{ cancelLabel }}
      </ion-button>
    </div>
  `,
  styles: [],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class ModalFooterComponent {
  @Input() submitLabel: string = 'Confirmar';
  @Input() submitColor: string = 'primary';
  @Input() submitType: string = 'button';
  @Input() icon: string | null = null;
  @Input() isDisabled: boolean = false;
  
  @Input() showCancel: boolean = false;
  @Input() cancelLabel: string = 'Cancelar';
  @Input() cancelIcon: string | null = null;
  
  @Output() submit = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onSubmit() {
    this.submit.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}
