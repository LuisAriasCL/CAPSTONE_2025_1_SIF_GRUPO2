/**
 * Constantes de configuración de la aplicación
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3001',
  ENDPOINTS: {
    AUTH: '/api/auth',
    USUARIOS: '/api/usuarios',
    VEHICULOS: '/api/vehiculos',
    RUTAS: '/api/rutas',
    ASIGNACIONES: '/api/asignaciones-recorrido',
    COMBUSTIBLE: '/api/combustible',
    SINIESTROS: '/api/siniestros',
    PLANIFICACIONES: '/api/planificaciones-mantenimiento',
    ORDENES_TRABAJO: '/api/ordenes-trabajo',
    STATS: '/api/stats',
  },
  TIMEOUT: 30000,
} as const;

// UI Configuration
export const UI_CONFIG = {
  TOAST: {
    DURATION: 3000,
    ERROR_DURATION: 5000,
    POSITION: 'bottom' as const,
  },
  LOADING: {
    DURATION: 30000,
  },
  ANIMATION: {
    DURATION: 1000,
    TAB_CHANGE_DELAY: 300,
  },
} as const;

// Form Configuration
export const FORM_CONFIG = {
  VALIDATION: {
    MIN_DESCRIPTION_LENGTH: 5,
    MAX_DESCRIPTION_LENGTH: 255,
    MIN_PASSWORD_LENGTH: 6,
    MAX_PASSWORD_LENGTH: 50,
    MIN_FREQUENCY: 1,
    MIN_TASKS: 1,
    MAX_TASK_NAME_LENGTH: 150,
    MAX_TASK_DESCRIPTION_LENGTH: 500,
  },
  DATE_FORMAT: 'YYYY-MM-DD',
} as const;

// Vehicle States
export const VEHICLE_STATES = {
  ACTIVO: 'activo',
  INACTIVO: 'inactivo',
  EN_MANTENIMIENTO: 'en mantenimiento',
  EN_REPARACION: 'en reparación',
  DADO_DE_BAJA: 'dado de baja',
} as const;

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  CONDUCTOR: 'conductor',
  GESTOR: 'gestor',
  MANTENIMIENTO: 'mantenimiento',
  TECNICO: 'tecnico',
} as const;

// Request Status
export const REQUEST_STATUS = {
  SOLICITADO: 'solicitado',
  EN_PROGRESO: 'en_progreso',
  COMPLETADO: 'completado',
  CANCELADO: 'cancelado',
} as const;

// Incident Status
export const INCIDENT_STATUS = {
  REPORTADO: 'reportado',
  EN_REVISION: 'en_revision',
  RESUELTO: 'resuelto',
  CANCELADO: 'cancelado',
} as const;

// Fuel Types
export const FUEL_TYPES = {
  GASOLINA_93: 'gasolina_93',
  GASOLINA_95: 'gasolina_95',
  GASOLINA_97: 'gasolina_97',
  DIESEL: 'diesel',
  ELECTRICO: 'electrico',
  OTRO: 'otro',
} as const;

// Frequency Types
export const FREQUENCY_TYPES = {
  KM: 'km',
  DIAS: 'dias',
  SEMANAS: 'semanas',
  MESES: 'meses',
} as const;
