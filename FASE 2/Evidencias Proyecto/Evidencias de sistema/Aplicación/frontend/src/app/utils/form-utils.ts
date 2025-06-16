import { FormGroup, AbstractControl } from '@angular/forms';

export class FormUtils {
  
  /**
   * Marca todos los campos del formulario como tocados
   */
  static markAllFieldsAsTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markAllFieldsAsTouched(control);
      } else {
        control?.markAsTouched();
      }
    });
  }

  /**
   * Obtiene el primer error del formulario
   */
  static getFirstFormError(formGroup: FormGroup): string | null {
    const errorMessages: { [key: string]: string } = {
      required: 'Este campo es requerido',
      email: 'Debe ser un email válido',
      minlength: 'Debe tener al menos {requiredLength} caracteres',
      maxlength: 'No puede tener más de {requiredLength} caracteres',
      min: 'El valor mínimo es {min}',
      max: 'El valor máximo es {max}',
      pattern: 'El formato no es válido'
    };

    for (const fieldName in formGroup.controls) {
      const fieldControl = formGroup.get(fieldName);
      if (fieldControl && fieldControl.invalid && fieldControl.touched) {
        const fieldErrors = fieldControl.errors;
        if (fieldErrors) {
          for (const errorType in fieldErrors) {
            const error = fieldErrors[errorType];
            let message = errorMessages[errorType] || 'Campo inválido';
            
            // Reemplazar placeholders con valores reales
            if (typeof error === 'object') {
              Object.keys(error).forEach(key => {
                message = message.replace(`{${key}}`, error[key]);
              });
            }
            
            return `${this.getFieldDisplayName(fieldName)}: ${message}`;
          }
        }
      }
    }
    return null;
  }

  /**
   * Verifica si un campo específico tiene errores
   */
  static hasFieldError(formGroup: FormGroup, fieldName: string, isSubmitted: boolean = false): boolean {
    const field = formGroup.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || isSubmitted));
  }

  /**
   * Obtiene el mensaje de error para un campo específico
   */
  static getFieldErrorMessage(fieldName: string, errors: any): string {
    if (!errors) return '';

    const fieldDisplayName = this.getFieldDisplayName(fieldName);
    const errorMessages: { [key: string]: (error: any) => string } = {
      required: () => `${fieldDisplayName} es requerido`,
      email: () => `${fieldDisplayName} debe ser un email válido`,
      minlength: (error) => `${fieldDisplayName} debe tener al menos ${error.requiredLength} caracteres`,
      maxlength: (error) => `${fieldDisplayName} no puede tener más de ${error.requiredLength} caracteres`,
      min: (error) => `${fieldDisplayName} debe ser mayor o igual a ${error.min}`,
      max: (error) => `${fieldDisplayName} debe ser menor o igual a ${error.max}`,
      pattern: () => `${fieldDisplayName} tiene un formato inválido`
    };

    // Obtener el primer error
    const errorType = Object.keys(errors)[0];
    const errorValue = errors[errorType];
    
    if (errorMessages[errorType]) {
      return errorMessages[errorType](errorValue);
    }
    
    return `${fieldDisplayName} es inválido`;
  }

  /**
   * Convierte el nombre del campo técnico a un nombre legible
   */
  private static getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      // Campos de vehículo
      patente: 'Patente',
      chasis: 'Chasis',
      tipoVehi: 'Tipo de vehículo',
      estadoVehi: 'Estado del vehículo',
      tipoCombVehi: 'Tipo de combustible',
      kmVehi: 'Kilometraje',
      marca: 'Marca',
      modelo: 'Modelo',
      anio: 'Año',
      kmVidaUtil: 'Kilometraje vida útil',
      efiComb: 'Eficiencia de combustible',
      fecAdqui: 'Fecha de adquisición',
      latitud: 'Latitud',
      longitud: 'Longitud',
      
      // Campos de asignación
      usuarioIdUsu: 'Conductor',
      rutaIdRuta: 'Ruta',
      vehiculoIdVehi: 'Vehículo',
      fecIniRecor: 'Fecha de inicio',
      kmIniRecor: 'Kilometraje inicial',
      estadoAsig: 'Estado de asignación',
      fecFinRecor: 'Fecha de fin',
      kmFinRecor: 'Kilometraje final',
      efiCombRecor: 'Eficiencia de combustible',
      notas: 'Notas',
      
      // Campos de ruta
      nombre: 'Nombre',
      descripcion: 'Descripción',
      
      // Campos de planificación
      vehiculoId: 'Vehículo',
      tipoMantenimiento: 'Tipo de mantenimiento',
      fechaProgramada: 'Fecha programada',
      descripcionGeneral: 'Descripción general',
      
      // Campos de tareas
      descripcionTarea: 'Descripción de tarea',
      tiempoEstimado: 'Tiempo estimado'
    };

    return displayNames[fieldName] || fieldName;
  }

  /**
   * Valida un formulario y retorna el primer error encontrado
   */
  static validateForm(formGroup: FormGroup): { isValid: boolean; firstError?: string } {
    if (formGroup.valid) {
      return { isValid: true };
    }

    this.markAllFieldsAsTouched(formGroup);
    const firstError = this.getFirstFormError(formGroup);
    
    return { 
      isValid: false, 
      firstError: firstError || 'Por favor, corrige los errores en el formulario' 
    };
  }
}