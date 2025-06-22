import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormFieldComponent } from './form-field/form-field.component';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    FormFieldComponent
  ],
  exports: [
    FormFieldComponent
  ]
})
export class ComponentesModule { }
