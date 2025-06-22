import { SelectOption } from '../types/common.types';
import { EstadoVehiculo, TipoVehiculo, TipoCombustible } from '../types/vehicle.types';

export const VEHICLE_CONSTANTS = {
  ESTADO_OPTIONS: ['activo', 'inactivo', 'mantenimiento', 'taller'] as const,
  TIPO_OPTIONS: ['Camioneta', 'Furgón', 'Camión Liviano', 'Camión Pesado'] as const,
  
  COMBUSTIBLE_OPTIONS: [
    { value: '', label: 'Ninguno' },
    { value: 'gasolina_93', label: '93 Octanos' },
    { value: 'gasolina_95', label: '95 Octanos' },
    { value: 'gasolina_97', label: '97 Octanos' },
    { value: 'diesel', label: 'Diesel' },
    { value: 'electrico', label: 'Eléctrico' }
  ] as SelectOption[],
  
  VALIDATION_MESSAGES: {
    patente: {
      required: 'La patente es requerida',
      minlength: 'La patente debe tener al menos 6 caracteres'
    },
    chasis: {
      required: 'El chasis es requerido',
      minlength: 'El chasis debe tener al menos 17 caracteres'
    },
    marca: {
      required: 'La marca es requerida'
    },
    modelo: {
      required: 'El modelo es requerido'
    },
    anio: {
      required: 'El año es requerido',
      min: 'El año debe ser mayor a 1970',
      max: 'El año debe ser menor o igual a 2025'
    },
    kmVehi: {
      required: 'El kilometraje es requerido',
      min: 'El kilometraje debe ser mayor o igual a 0'
    },
    fecAdqui: {
      required: 'La fecha de adquisición es requerida'
    },
    estadoVehi: {
      required: 'El estado es requerido'
    }
  }
} as const;

export const VEHICLE_ESTADO_LABELS: Record<EstadoVehiculo, string> = {
  'activo': 'Activo',
  'inactivo': 'Inactivo',
  'mantenimiento': 'En Mantenimiento',
  'taller': 'En Reparación'
};

export const VEHICLE_TIPO_LABELS: Record<TipoVehiculo, string> = {
  'Camioneta': 'Camioneta',
  'Furgón': 'Furgón',
  'Camión Liviano': 'Camión Liviano',
  'Camión Pesado': 'Camión Pesado'
};
