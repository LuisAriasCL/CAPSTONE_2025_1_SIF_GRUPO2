import { SelectOption } from '../types/common.types';

export const ASSIGNMENT_CONSTANTS = {
  PRIORIDAD_OPTIONS: [
    { value: 'baja', label: 'Baja' },
    { value: 'media', label: 'Media' },
    { value: 'alta', label: 'Alta' },
    { value: 'urgente', label: 'Urgente' }
  ] as SelectOption[],
  
  ESTADO_OPTIONS: [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'en_progreso', label: 'En Progreso' },
    { value: 'completado', label: 'Completado' },
    { value: 'cancelado', label: 'Cancelado' }
  ] as SelectOption[],
  
  VALIDATION_MESSAGES: {
    rutaId: {
      required: 'Debe seleccionar una ruta'
    },
    vehiculoId: {
      required: 'Debe seleccionar un vehículo'
    },
    conductorId: {
      required: 'Debe seleccionar un conductor'
    },
    fechaInicio: {
      required: 'La fecha de inicio es requerida'
    },
    fechaFin: {
      required: 'La fecha de fin es requerida'
    },
    kilometrajeInicial: {
      required: 'El kilometraje inicial es requerido',
      min: 'El kilometraje debe ser mayor a 0',
      pattern: 'Ingrese solo números'
    },
    kilometrajeFinal: {
      required: 'El kilometraje final es requerido',
      min: 'El kilometraje debe ser mayor a 0',
      pattern: 'Ingrese solo números',
      kilometrajeFinalMayorQueInicial: 'El kilometraje final debe ser mayor al inicial'
    },
    observaciones: {
      maxlength: 'Las observaciones no deben exceder 500 caracteres'
    },
    prioridad: {
      required: 'Debe seleccionar una prioridad'
    }
  },
  
  FORM_CONFIG: {
    MIN_KILOMETRAJE: 0,
    MAX_KILOMETRAJE: 999999,
    MAX_OBSERVACIONES_LENGTH: 500
  }
} as const;

export const ASSIGNMENT_ESTADO_LABELS = {
  'pendiente': 'Pendiente',
  'en_progreso': 'En Progreso',
  'completado': 'Completado',
  'cancelado': 'Cancelado'
} as const;

export const ASSIGNMENT_PRIORIDAD_LABELS = {
  'baja': 'Baja',
  'media': 'Media',
  'alta': 'Alta',
  'urgente': 'Urgente'
} as const;
