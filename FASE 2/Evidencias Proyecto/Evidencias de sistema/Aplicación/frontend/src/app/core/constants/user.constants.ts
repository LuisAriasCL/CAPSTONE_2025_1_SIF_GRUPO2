import { SelectOption } from '../types/common.types';

export const USER_CONSTANTS = {
  ROLES: [
    { value: 'admin', label: 'Administrador' },
    { value: 'gestor', label: 'Gestor' },
    { value: 'conductor', label: 'Conductor' },
    { value: 'mantenimiento', label: 'Mantenimiento' },
    { value: 'tecnico', label: 'Técnico' }
  ] as SelectOption[],
  
  VALIDATION_MESSAGES: {
    pri_nom_usu: {
      required: 'El primer nombre es requerido',
      pattern: 'El nombre solo puede contener letras',
      minlength: 'El nombre debe tener al menos 2 caracteres',
      maxlength: 'El nombre no debe exceder 50 caracteres'
    },
    pri_ape_usu: {
      required: 'El apellido es requerido',
      pattern: 'El apellido solo puede contener letras',
      minlength: 'El apellido debe tener al menos 2 caracteres',
      maxlength: 'El apellido no debe exceder 50 caracteres'
    },
    email: {
      required: 'El email es requerido',
      email: 'Ingrese un email válido',
      pattern: 'El formato del email no es válido'
    },
    rol: {
      required: 'El rol es requerido'
    },
    clave: {
      required: 'La contraseña es requerida',
      minlength: 'La contraseña debe tener al menos 6 caracteres',
      maxlength: 'La contraseña no debe exceder 50 caracteres',
      pattern: 'La contraseña debe contener al menos una letra y un número'
    }
  },
  
  FORM_CONFIG: {
    MIN_NAME_LENGTH: 2,
    MAX_NAME_LENGTH: 50,
    MIN_PASSWORD_LENGTH: 6,
    MAX_PASSWORD_LENGTH: 50
  }
} as const;

export const USER_ROLE_LABELS = {
  'admin': 'Administrador',
  'gestor': 'Gestor',
  'conductor': 'Conductor',
  'mantenimiento': 'Mantenimiento',
  'tecnico': 'Técnico'
} as const;
