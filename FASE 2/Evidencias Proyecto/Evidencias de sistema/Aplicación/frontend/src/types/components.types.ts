//ENUMS DE VEHICULOS
// Definición de tipos y estructuras para la aplicación de gestión de vehículos
export type EstadoVehiculo =
  | 'activo'
  | 'inactivo'
  | 'mantenimiento'
  | 'taller'
  | 'baja';
export type TipoCombustibleVehiculo =
  | 'gasolina_93'
  | 'gasolina_95'
  | 'gasolina_97'
  | 'diesel'
  | 'electrico'
  | 'otro';

// Interface para representar un vehículo
export interface Vehiculo {
  idVehi?: number;
  patente: string;
  chasis: string;
  tipoVehi?: string | null;
  estadoVehi: EstadoVehiculo;
  tipoCombVehi?: TipoCombustibleVehiculo | null;
  kmVehi: number;
  marca: string;
  modelo: string;
  anio: number;
  kmVidaUtil?: number | null;
  efiComb?: number | null;
  fecAdqui: string; // Usar string (YYYY-MM-DD) para compatibilidad API/backend
  latitud?: number | null;
  longitud?: number | null;
}
// Interface para los componentes de la aplicación en el menú lateral
export interface AppPage {
  title: string;
  url: string;
  icon: string;
}

// Interface para los botones de alerta personalizada
export interface AlertButton {
  text: string;
  role: 'confirm' | 'cancel' | 'destructive'; // Roles de los botones
  variant: 'primary' | 'secondary' | 'danger'; // Variantes de estilo
}

// Enum para los tipos de iconos de alerta
export enum AlertIconType {
  Warning = 'warning',
  Success = 'success',
  Error = 'error',
  Info = 'info',
  Help = 'help',
  Logout = 'logout',
}

// Estructura para botones de acción en tablas
export interface ActionButton {
  icon: string;
  color:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'light'
    | 'dark';
  tooltip: string;
  cssClass?: string;
  onClick: (row: any) => void;
}

// Estructura para columnas de tablas
export interface Column {
  header: string;
  field: string;
  sortable?: boolean;
  width?: string;
  cell?: (data: any) => string;
  isAction?: boolean;
}

// Estructura para la configuración de los datos de la tabla
export interface PageEvent {
  pageIndex: number;
  pageSize: number;
  length: number;
}

// Estructura para la respuesta paginada de vehículos
export interface PaginatedVehiculoResponse {
  data: Vehiculo[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}
