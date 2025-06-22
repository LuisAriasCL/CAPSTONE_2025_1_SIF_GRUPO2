// src/app/utils/form.validators.ts

import { AbstractControl, ValidatorFn, ValidationErrors, FormGroup } from '@angular/forms';

/**
 * Validador para formato de patente chilena: XXXX-XX (4 letras, guión, 2 números)
 * @returns Función validadora que verifica el formato correcto de patente
 */
export function patenteValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null; // Si el campo está vacío, otros validadores se encargarán (como required)
    }

    const valid = /^[A-Za-z]{4}-[0-9]{2}$/.test(control.value);
    return valid ? null : { invalidPatente: true };
  };
}

/**
 * Validador para el número de chasis (17 caracteres)
 * @returns Función validadora que verifica que el chasis tenga exactamente 17 caracteres
 */
export function chasisValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null; // Si el campo está vacío, otros validadores se encargarán (como required)
    }

    const length = control.value.toString().length;
    return length === 17 ? null : { invalidChasis: { requiredLength: 17, actualLength: length } };
  };
}

/**
 * Validador para rangos numéricos
 * @param min Valor mínimo permitido
 * @param max Valor máximo permitido
 * @returns Función validadora que verifica que el valor esté dentro del rango
 */
export function rangeValidator(min: number, max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.value === null || control.value === undefined || control.value === '') {
      return null; // Si el campo está vacío, otros validadores se encargarán (como required)
    }

    const value = Number(control.value);
    if (isNaN(value)) {
      return { notANumber: true };
    }

    if (value < min) {
      return { minValue: { required: min, actual: value } };
    }

    if (value > max) {
      return { maxValue: { required: max, actual: value } };
    }

    return null;
  };
}

/**
 * Validador para año de fabricación
 * @param minYear Año mínimo permitido (por defecto 1970)
 * @param maxYear Año máximo permitido (por defecto el año actual)
 * @returns Función validadora que verifica que el año esté dentro del rango
 */
export function yearValidator(minYear: number = 1970, maxYear: number = new Date().getFullYear()): ValidatorFn {
  return rangeValidator(minYear, maxYear);
}

/**
 * Validador para kilometraje
 * @param maxKm Kilometraje máximo permitido (por defecto 1,000,000)
 * @returns Función validadora que verifica que el kilometraje sea positivo y menor que el máximo
 */
export function kilometrajeValidator(maxKm: number = 1000000): ValidatorFn {
  return rangeValidator(0, maxKm);
}

/**
 * Validador para eficiencia de combustible (km/L)
 * @param minEficiencia Eficiencia mínima (por defecto 2 km/L)
 * @param maxEficiencia Eficiencia máxima (por defecto 30 km/L)
 * @returns Función validadora que verifica que la eficiencia esté dentro del rango
 */
export function eficienciaCombustibleValidator(minEficiencia: number = 2, maxEficiencia: number = 30): ValidatorFn {
  return rangeValidator(minEficiencia, maxEficiencia);
}

/**
 * Validador para coordenadas de latitud
 * @returns Función validadora que verifica que la latitud esté entre -90 y 90
 */
export function latitudValidator(): ValidatorFn {
  return rangeValidator(-90, 90);
}

/**
 * Validador para coordenadas de longitud
 * @returns Función validadora que verifica que la longitud esté entre -180 y 180
 */
export function longitudValidator(): ValidatorFn {
  return rangeValidator(-180, 180);
}

/**
 * Validador para asegurar que el kilometraje final sea mayor que el inicial
 * @param inicialControlName Nombre del control que contiene el kilometraje inicial
 * @param finalControlName Nombre del control que contiene el kilometraje final
 * @returns Función validadora que verifica la relación entre los kilometrajes
 */
export function kilometrajeFinalMayorQueInicialValidator(inicialControlName: string, finalControlName: string): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    if (!(formGroup instanceof FormGroup)) {
      return null;
    }

    const inicialControl = formGroup.get(inicialControlName);
    const finalControl = formGroup.get(finalControlName);

    if (!inicialControl || !finalControl || !inicialControl.value || !finalControl.value) {
      return null;
    }

    const kmInicial = Number(inicialControl.value);
    const kmFinal = Number(finalControl.value);

    if (kmFinal <= kmInicial) {
      const error = { kilometrajeFinalInvalido: true };
      finalControl.setErrors({ ...finalControl.errors, ...error });
      return error;
    } else {
      if (finalControl.errors) {
        const { kilometrajeFinalInvalido, ...otherErrors } = finalControl.errors;
        finalControl.setErrors(Object.keys(otherErrors).length ? otherErrors : null);
      }
      return null;
    }
  };
}

/**
 * Validador para asegurar que la fecha final sea posterior a la fecha inicial
 * @param fechaInicialControlName Nombre del control que contiene la fecha inicial
 * @param fechaFinalControlName Nombre del control que contiene la fecha final
 * @returns Función validadora que verifica la relación entre las fechas
 */
export function fechaFinalPosteriorAInicialValidator(fechaInicialControlName: string, fechaFinalControlName: string): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    if (!(formGroup instanceof FormGroup)) {
      return null;
    }

    const fechaInicialControl = formGroup.get(fechaInicialControlName);
    const fechaFinalControl = formGroup.get(fechaFinalControlName);

    if (!fechaInicialControl || !fechaFinalControl || !fechaInicialControl.value || !fechaFinalControl.value) {
      return null;
    }

    const fechaInicial = new Date(fechaInicialControl.value);
    const fechaFinal = new Date(fechaFinalControl.value);

    if (fechaFinal <= fechaInicial) {
      const error = { fechaFinalInvalida: true };
      fechaFinalControl.setErrors({ ...fechaFinalControl.errors, ...error });
      return error;
    } else {
      if (fechaFinalControl.errors) {
        const { fechaFinalInvalida, ...otherErrors } = fechaFinalControl.errors;
        fechaFinalControl.setErrors(Object.keys(otherErrors).length ? otherErrors : null);
      }
      return null;
    }
  };
}

/**
 * Validador para RUT chileno
 * @returns Función validadora que verifica que el RUT tenga el formato correcto y que el dígito verificador sea válido
 */
export function rutValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null; // Si el campo está vacío, otros validadores se encargarán (como required)
    }

    // Eliminar guiones y puntos
    const rutLimpio = control.value.toString().replace(/[.-]/g, '');
    
    // Verificar formato: 7-9 dígitos seguidos de un dígito verificador (que puede ser K)
    if (!/^(\d{7,9})([0-9K])$/i.test(rutLimpio)) {
      return { invalidRut: true };
    }

    const rutSinDv = rutLimpio.slice(0, -1);
    const dv = rutLimpio.slice(-1).toUpperCase();
    
    // Calcular dígito verificador
    let suma = 0;
    let multiplicador = 2;
    
    for (let i = rutSinDv.length - 1; i >= 0; i--) {
      suma += parseInt(rutSinDv.charAt(i)) * multiplicador;
      multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }
    
    const dvCalculado = 11 - (suma % 11);
    let dvEsperado: string;
    
    if (dvCalculado === 11) {
      dvEsperado = '0';
    } else if (dvCalculado === 10) {
      dvEsperado = 'K';
    } else {
      dvEsperado = dvCalculado.toString();
    }
    
    return dv === dvEsperado ? null : { invalidRut: true };
  };
}

/**
 * Obtiene mensajes de error personalizados para validaciones
 * @param control Control a validar
 * @param fieldName Nombre del campo para mostrar en los mensajes
 * @returns Mensajes de error basados en las validaciones fallidas
 */
export function getValidationErrorMessage(control: AbstractControl, fieldName: string): string | null {
  if (!control || !control.errors) {
    return null;
  }

  const errors = control.errors;

  if (errors['required']) {
    return `${fieldName} es requerido.`;
  }

  if (errors['invalidPatente']) {
    return `Formato de patente inválido. Debe ser XXXX-XX (4 letras, guión, 2 números).`;
  }

  if (errors['invalidChasis']) {
    return `El chasis debe tener exactamente 17 caracteres.`;
  }

  if (errors['minValue']) {
    return `${fieldName} debe ser mayor o igual a ${errors['minValue'].required}.`;
  }

  if (errors['maxValue']) {
    return `${fieldName} debe ser menor o igual a ${errors['maxValue'].required}.`;
  }

  if (errors['notANumber']) {
    return `${fieldName} debe ser un número.`;
  }

  if (errors['kilometrajeFinalInvalido']) {
    return `El kilometraje final debe ser mayor que el kilometraje inicial.`;
  }

  if (errors['fechaFinalInvalida']) {
    return `La fecha final debe ser posterior a la fecha inicial.`;
  }

  if (errors['invalidRut']) {
    return `RUT inválido. Verifique el formato y el dígito verificador.`;
  }

  if (errors['pattern']) {
    return `Formato de ${fieldName} inválido.`;
  }

  if (errors['email']) {
    return `Formato de correo electrónico inválido.`;
  }

  if (errors['minlength']) {
    return `${fieldName} debe tener al menos ${errors['minlength'].requiredLength} caracteres.`;
  }

  if (errors['maxlength']) {
    return `${fieldName} no puede tener más de ${errors['maxlength'].requiredLength} caracteres.`;
  }

  // Si hay otros errores que no manejamos específicamente
  return `${fieldName} tiene un formato inválido.`;
}

/**
 * Clase de utilidades para validaciones de formularios
 */
export class FormValidationUtils {/**
   * Verifica si un campo tiene errores y ha sido tocado o modificado
   * @param control Control a verificar
   * @param isSubmitted Si el formulario ha sido enviado
   * @returns Verdadero si el campo tiene errores y ha sido tocado, modificado, o el formulario ha sido enviado
   */
  static isFieldInvalid(control: AbstractControl | null, isSubmitted: boolean): boolean {
    if (!control) {
      return false;
    }
    
    // Si el formulario ha sido enviado o el campo ha sido tocado/modificado
    const touched = control.touched || control.dirty || isSubmitted;
    
    // Verificar estado de validez
    const invalid = control.invalid;
    
    console.log(`Control validación: Touched=${touched}, Invalid=${invalid}, Submitted=${isSubmitted}`);
    
    return invalid && touched;
  }

  /**
   * Obtiene mensajes de error para un campo
   * @param control Control a verificar
   * @param fieldName Nombre del campo
   * @returns Mensaje de error o null si no hay errores
   */
  static getErrorMessage(control: AbstractControl | null, fieldName: string): string | null {
    if (!control || !control.errors) {
      return null;
    }
    return getValidationErrorMessage(control, fieldName);
  }

  /**
   * Marca todos los campos de un formulario como tocados
   * @param formGroup Formulario a marcar
   */
  static markAllFieldsAsTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof FormGroup) {
        this.markAllFieldsAsTouched(control);
      } else {
        control?.markAsTouched();
      }
    });
  }
}
