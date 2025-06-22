import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ModalHeaderComponent } from './modal-header/modal-header.component';
import { ModalFooterComponent } from './modal-footer/modal-footer.component';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    ModalHeaderComponent,
    ModalFooterComponent
  ],
  exports: [
    ModalHeaderComponent,
    ModalFooterComponent
  ]
})
export class ModalComponentsModule { }
