import { SelectOption } from '../types/common.types';

export const MAINTENANCE_CONSTANTS = {
  FREQUENCY_TYPES: [
    { value: 'km', label: 'Kilómetros' },
    { value: 'dias', label: 'Días' },
    { value: 'semanas', label: 'Semanas' },
    { value: 'meses', label: 'Meses' }
  ] as SelectOption[],
  
  TIPO_FRECUENCIA_OPTIONS: [
    { value: 'km', label: 'Kilómetros' },
    { value: 'dias', label: 'Días' },
    { value: 'semanas', label: 'Semanas' },
    { value: 'meses', label: 'Meses' }
  ] as SelectOption[],
  
  PRIORIDAD_OPTIONS: [
    { value: 'baja', label: 'Baja' },
    { value: 'media', label: 'Media' },
    { value: 'alta', label: 'Alta' },
    { value: 'critica', label: 'Crítica' }
  ] as SelectOption[],
  
  VALIDATION_MESSAGES: {
    descPlan: {
      required: 'La descripción es requerida',
      minlength: 'La descripción debe tener al menos 5 caracteres',
      maxlength: 'La descripción no debe exceder 255 caracteres'
    },
    tipoFrecuencia: {
      required: 'El tipo de frecuencia es requerido'
    },
    frecuencia: {
      required: 'La frecuencia es requerida',
      min: 'La frecuencia debe ser mayor a 0'
    },
    vehiculosIds: {
      required: 'Debe seleccionar al menos un vehículo',
      minlength: 'Debe seleccionar al menos un vehículo'
    },
    tareas: {
      required: 'Debe agregar al menos una tarea',
      minlength: 'Debe agregar al menos una tarea'
    },
    nomTareaPlan: {
      required: 'El nombre de la tarea es requerido',
      maxlength: 'El nombre no debe exceder 150 caracteres'
    },
    descTareaPlan: {
      maxlength: 'La descripción no debe exceder 500 caracteres'
    }
  }
} as const;

export const MAINTENANCE_TIPO_FRECUENCIA_LABELS = {
  'km': 'Kilómetros',
  'dias': 'Días',
  'semanas': 'Semanas',
  'meses': 'Meses'
} as const;
