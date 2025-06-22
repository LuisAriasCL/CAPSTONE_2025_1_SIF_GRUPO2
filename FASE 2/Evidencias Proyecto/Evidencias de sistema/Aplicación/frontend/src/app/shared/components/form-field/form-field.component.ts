import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { AbstractControl } from '@angular/forms';
import { FormUtils } from '../../../core/utils/form.utils';

@Component({
  selector: 'app-form-field',
  templateUrl: './form-field.component.html',
  styleUrls: ['./form-field.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class FormFieldComponent implements OnChanges {
  @Input() control: AbstractControl | null = null;
  @Input() fieldName: string = '';
  @Input() isSubmitted: boolean = false;
  @Input() customErrorMessage: string | null = null;

  // Exponer FormUtils a la plantilla
  public FormUtils = FormUtils;
  
  // Para depuración
  private _hasErrorValue: boolean = false;
  private _errorMessage: string = '';

  ngOnChanges(changes: SimpleChanges) {
    // Actualizar valores cuando cambien las propiedades de entrada
    this._hasErrorValue = this.hasError();
    this._errorMessage = this.getErrorMessage();
    
    // Log para depuración
    console.log(`Control: ${this.fieldName}, Invalid: ${this.control?.invalid}, 
                Touched: ${this.control?.touched}, Dirty: ${this.control?.dirty}, 
                Submitted: ${this.isSubmitted}, HasError: ${this._hasErrorValue}, 
                Message: ${this._errorMessage}`);
  }
  /**
   * Verifica si el control tiene errores
   */
  hasError(): boolean {
    return this.control !== null && 
           this.control.invalid && 
           (this.control.touched || this.control.dirty || this.isSubmitted);
  }

  /**
   * Obtiene el mensaje de error
   */
  getErrorMessage(): string {
    if (this.customErrorMessage) {
      return this.customErrorMessage;
    }
    
    if (this.control && this.fieldName) {
      const errorMsg = FormUtils.getFieldErrorMessage(this.control, this.fieldName);
      return errorMsg || '';
    }
    
    return '';
  }
}
