import { BaseEntity } from './common.types';

export type EstadoVehiculo = 'activo' | 'inactivo' | 'mantenimiento' | 'taller';
export type TipoVehiculo = 'Camioneta' | 'Furgón' | 'Camión Liviano' | 'Camión Pesado';
export type TipoCombustible = '' | 'gasolina_93' | 'gasolina_95' | 'gasolina_97' | 'diesel' | 'electrico';

export interface Vehiculo extends BaseEntity {
  idVehi: number;
  patente: string;
  chasis: string;
  marca: string;
  modelo: string;
  anio: number;
  kmVehi: number;
  fecAdqui: string;
  estadoVehi: EstadoVehiculo;
  tipoVehi?: TipoVehiculo;
  tipoCombVehi?: TipoCombustible;
  kmVidaUtil?: number;
  efiComb?: number;
  latitud?: number;
  longitud?: number;
}

export interface VehiculoFormData {
  patente: string;
  chasis: string;
  marca: string;
  modelo: string;
  anio: number;
  kmVehi: number;
  fecAdqui: string;
  estadoVehi: EstadoVehiculo;
  tipoVehi?: TipoVehiculo;
  tipoCombVehi?: TipoCombustible;
  kmVidaUtil?: number;
  efiComb?: number;
  latitud?: number;
  longitud?: number;
}

export interface VehiculoAsignacionInfo {
  idVehi: number;
  patente: string;
  modelo?: string;
  marca?: string;
}
