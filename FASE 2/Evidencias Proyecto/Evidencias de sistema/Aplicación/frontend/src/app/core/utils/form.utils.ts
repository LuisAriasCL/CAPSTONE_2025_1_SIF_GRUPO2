/**
 * Utilidades para el manejo de formularios en la aplicación
 */

import { ToastController } from '@ionic/angular';
import { AbstractControl, FormGroup } from '@angular/forms';
import { SelectOption } from '../types/common.types';

export class FormHelpers {
  /**
   * Crea un toast con configuración estándar
   * @param toastCtrl Controlador de toast de Ionic
   * @param message Mensaje a mostrar
   * @param color Color del toast
   * @param duration Duración en milisegundos
   */
  static async createToast(
    toastCtrl: ToastController,
    message: string,
    color: 'success' | 'warning' | 'danger' | 'dark' = 'dark',
    duration: number = 3000
  ): Promise<void> {
    const toast = await toastCtrl.create({
      message,
      duration,
      color,
      position: 'bottom',
      buttons: [{ text: 'Cerrar', role: 'cancel' }]
    });
    await toast.present();
  }

  /**
   * Enfoca un elemento por ID y lo anima
   * @param elementId ID del elemento a enfocar
   * @param animationDuration Duración de la animación en ms
   */
  static focusElement(elementId: string, animationDuration: number = 1000): void {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.classList.add('shake-animation');
    setTimeout(() => element.classList.remove('shake-animation'), animationDuration);
  }

  /**
   * Valida si un formulario es válido y muestra el primer error
   * @param form FormGroup a validar
   * @param getFirstError Función que retorna el primer error
   * @param showToast Función para mostrar toast
   * @param focusError Función para enfocar error
   */
  static validateFormAndShowError<T>(
    form: any,
    getFirstError: () => T | null,
    showToast: (message: string, color?: string) => Promise<void>,
    focusError: (error: T) => void
  ): boolean {
    form.markAllAsTouched();
    
    if (form.invalid) {
      const firstError = getFirstError();
      if (firstError) {
        focusError(firstError);
      } else {
        showToast('Por favor, revise todos los campos del formulario.', 'warning');
      }
      return false;
    }
    return true;
  }

  /**
   * Mapea mensajes de error amigables para campos de formulario
   */
  static getFieldDisplayName(fieldId: string, fieldMapping: Record<string, string>): string {
    if (fieldId in fieldMapping) {
      return fieldMapping[fieldId];
    }
    return fieldId.includes('tarea') ? 'tarea' : 'campo';
  }
}

/**
 * Constantes para configuración de formularios
 */
export const FORM_CONSTANTS = {
  TOAST_DURATION: 3000,
  ERROR_TOAST_DURATION: 5000,
  ANIMATION_DURATION: 1000,
  TAB_CHANGE_DELAY: 300,
} as const;

/**
 * Configuraciones de validación reutilizables
 */
export const VALIDATION_CONFIG = {
  DESCRIPTION: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 255,
  },
  TASK_NAME: {
    MAX_LENGTH: 150,
  },
  TASK_DESCRIPTION: {
    MAX_LENGTH: 500,
  },
  FREQUENCY: {
    MIN: 1,
  },
  MIN_ITEMS: 1,
} as const;

export class FormUtils {
  static compareWith = (o1: any, o2: any): boolean => o1 === o2;

  static markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormGroup) {
        FormUtils.markFormGroupTouched(control);
      }
    });
  }

  static getFormErrors(formGroup: FormGroup): { [key: string]: any } {
    const errors: { [key: string]: any } = {};
    
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control && !control.valid && control.touched) {
        errors[key] = control.errors;
      }
    });
    
    return errors;
  }

  static createSelectOptions<T>(
    items: T[], 
    valueKey: keyof T, 
    labelKey: keyof T
  ): SelectOption[] {
    return items.map(item => ({
      value: item[valueKey],
      label: String(item[labelKey])
    }));
  }

  static getFieldErrorMessage(
    control: AbstractControl | null,
    fieldName: string,
    validationMessages?: any
  ): string | null {
    if (!control || !control.errors || !control.touched) {
      return null;
    }

    const errors = control.errors;
    const messages = validationMessages?.[fieldName] || {};

    if (errors['required']) return messages.required || `${fieldName} es requerido`;
    if (errors['email']) return messages.email || 'Email inválido';
    if (errors['minlength']) return messages.minlength || `Mínimo ${errors['minlength'].requiredLength} caracteres`;
    if (errors['maxlength']) return messages.maxlength || `Máximo ${errors['maxlength'].requiredLength} caracteres`;
    if (errors['min']) return messages.min || `Valor mínimo: ${errors['min'].min}`;
    if (errors['max']) return messages.max || `Valor máximo: ${errors['max'].max}`;

    return 'Campo inválido';
  }
}
