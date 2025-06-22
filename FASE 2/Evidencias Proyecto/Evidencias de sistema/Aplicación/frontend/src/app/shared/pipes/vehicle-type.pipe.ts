import { Pipe, PipeTransform } from '@angular/core';
import { VEHICLE_TIPO_LABELS } from 'src/app/core/constants';

@Pipe({
  name: 'vehicleType',
  standalone: true
})
export class VehicleTypePipe implements PipeTransform {
  transform(type: string): string {
    return VEHICLE_TIPO_LABELS[type as keyof typeof VEHICLE_TIPO_LABELS] || type;
  }
}
