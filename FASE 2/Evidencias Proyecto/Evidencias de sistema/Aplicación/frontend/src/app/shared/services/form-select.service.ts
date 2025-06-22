import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class FormSelectService {

  constructor() { }

  /**
   * Función compareWith estándar para ion-select
   * Debe ser usada en todos los ion-select del proyecto
   */
  static compareWith = (o1: any, o2: any) => {
    return o1 === o2;
  };

  /**
   * Maneja cambios en ion-select de manera estándar
   * @param event Evento de selectionChange
   * @param controlName Nombre del control del formulario
   * @param formGroup FormGroup que contiene el control
   */
  static onSelectChange(event: any, controlName: string, formGroup: FormGroup) {
    if (event && event.detail && event.detail.value !== undefined) {
      console.log(`${controlName} cambió a:`, event.detail.value);
      formGroup.get(controlName)?.setValue(event.detail.value);
      formGroup.get(controlName)?.markAsTouched();
    }
  }

  /**
   * Crea un FormGroup con configuración correcta para ion-select
   * @param formBuilder FormBuilder de Angular
   * @param config Configuración de campos
   */
  static createFormGroupWithCorrectSelects(formBuilder: FormBuilder, config: any): FormGroup {
    const formConfig: any = {};
    
    Object.keys(config).forEach(key => {
      const fieldConfig = config[key];
      
      if (fieldConfig.isSelect) {
        // Para selects, usar string vacío como valor inicial para que funcione el placeholder
        formConfig[key] = ['', fieldConfig.validators || []];
      } else {
        // Para otros campos, usar valor por defecto
        formConfig[key] = [fieldConfig.defaultValue || '', fieldConfig.validators || []];
      }
    });
    
    return formBuilder.group(formConfig);
  }

  /**
   * Valida que todos los selects tengan valores antes del submit
   * @param formGroup FormGroup a validar
   * @param selectFields Array con nombres de campos select
   */
  static validateSelectFields(formGroup: FormGroup, selectFields: string[]): boolean {
    let isValid = true;
    
    selectFields.forEach(field => {
      const control = formGroup.get(field);
      if (control && (!control.value || control.value === '')) {
        console.warn(`Select field '${field}' is empty`);
        control.markAsTouched();
        isValid = false;
      }
    });
    
    return isValid;
  }

  /**
   * Imprime información de debug sobre los valores del formulario
   * @param formGroup FormGroup a debuggear
   * @param formName Nombre del formulario para identificación
   */
  static debugFormValues(formGroup: FormGroup, formName: string = 'Formulario') {
    console.group(`🔍 Debug ${formName}`);
    console.log('Formulario válido:', formGroup.valid);
    console.log('Valores actuales:', formGroup.value);
    
    // Revisar cada control individualmente
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      console.log(`${key}:`, {
        value: control?.value,
        valid: control?.valid,
        touched: control?.touched,
        errors: control?.errors
      });
    });
    console.groupEnd();
  }
}

/**
 * Clase base que pueden extender los componentes de formulario
 * para tener funcionalidad estándar de ion-select
 */
export abstract class BaseFormComponent {
  
  // Función compareWith que debe ser usada en todos los ion-select
  compareWith = FormSelectService.compareWith;

  /**
   * Maneja cambios en ion-select
   * Debe ser sobrescrito en cada componente para usar su FormGroup específico
   */
  abstract onSelectChange(event: any, controlName: string): void;

  /**
   * Método de submit que debe ser implementado en cada componente
   */
  abstract onSubmit(): void;

  /**
   * Valida el formulario antes del submit
   * @param formGroup FormGroup a validar
   */
  protected validateForm(formGroup: FormGroup): boolean {
    if (formGroup.valid) {
      return true;
    } else {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(formGroup.controls).forEach(key => {
        formGroup.get(key)?.markAsTouched();
      });
      return false;
    }
  }

  /**
   * Debug del formulario
   * @param formGroup FormGroup a debuggear
   * @param formName Nombre del formulario
   */
  protected debugForm(formGroup: FormGroup, formName?: string) {
    FormSelectService.debugFormValues(formGroup, formName);
  }
}