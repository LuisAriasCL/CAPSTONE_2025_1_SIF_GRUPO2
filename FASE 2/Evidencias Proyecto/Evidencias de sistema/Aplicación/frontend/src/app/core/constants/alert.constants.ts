/**
 * Constantes relacionadas con alertas y confirmaciones
 */

export const ALERT_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  HELP: 'help',
  LOGOUT: 'logout'
} as const;

export const CONFIRMATION_TYPES = {
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  DISCARD: 'discard',
  LOGOUT: 'logout',
  SUBMIT: 'submit',
  APPROVE: 'approve',
  REJECT: 'reject',
  CANCEL: 'cancel'
} as const;

export const ENTITY_NAMES = {
  VEHICLE: 'vehículo',
  MAINTENANCE: 'planificación de mantenimiento',
  USER: 'usuario',
  ROUTE: 'ruta',
  ASSIGNMENT: 'asignación',
  INCIDENT: 'siniestro',
  WORK_ORDER: 'orden de trabajo',
  TASK: 'tarea',
  FUEL_RECORD: 'registro de combustible'
} as const;

export const ALERT_MESSAGES = {
  // Mensajes de éxito
  CREATED_SUCCESS: (entity: string) => `${entity} creado exitosamente.`,
  UPDATED_SUCCESS: (entity: string) => `${entity} actualizado exitosamente.`,
  DELETED_SUCCESS: (entity: string) => `${entity} eliminado exitosamente.`,
  SAVED_SUCCESS: 'Datos guardados exitosamente.',
  
  // Mensajes de error
  GENERIC_ERROR: 'Ha ocurrido un error. Por favor, inténtelo de nuevo.',
  VALIDATION_ERROR: 'Por favor, revise los campos del formulario e inténtelo de nuevo.',
  SERVER_ERROR: 'Error de conexión con el servidor. Por favor, inténtelo más tarde.',
  NOT_FOUND: (entity: string) => `${entity} no encontrado.`,
  
  // Mensajes de confirmación
  CONFIRM_CREATE: (entity: string) => `¿Está seguro que desea crear este ${entity}?`,
  CONFIRM_UPDATE: (entity: string) => `¿Está seguro que desea actualizar este ${entity}?`,
  CONFIRM_DELETE: (entity: string, details?: string) => 
    details ? `¿Está seguro que desea eliminar ${entity} "${details}"?` : `¿Está seguro que desea eliminar este ${entity}?`,
  CONFIRM_DISCARD: '¿Está seguro que desea descartar los cambios no guardados?',
  CONFIRM_LOGOUT: '¿Está seguro que desea cerrar sesión?',
  
  // Mensajes de advertencia
  UNSAVED_CHANGES: 'Tiene cambios sin guardar. ¿Desea guardarlos antes de continuar?',
  REQUIRED_FIELDS: 'Por favor, complete todos los campos requeridos.',
  LIMIT_REACHED: (limit: number, entity: string) => `Ha alcanzado el límite de ${limit} ${entity}.`
} as const;
