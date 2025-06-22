import { Pipe, PipeTransform } from '@angular/core';
import { VEHICLE_ESTADO_LABELS } from '../../core/constants/vehicle.constants';

@Pipe({
  name: 'vehicleStatus',
  standalone: true
})
export class VehicleStatusPipe implements PipeTransform {
  transform(status: string): string {
    return VEHICLE_ESTADO_LABELS[status as keyof typeof VEHICLE_ESTADO_LABELS] || status;
  }
}
