import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router'; // Se importa RouterLink
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowForwardOutline } from 'ionicons/icons';

@Component({
  selector: 'app-servicios-tecnico',
  templateUrl: './servicios-tecnico.page.html',
  styleUrls: ['./servicios-tecnico.page.scss'],
  standalone: true,
  // Se agrega RouterLink a los imports, necesario para la navegación
  imports: [CommonModule, IonicModule, RouterLink]
})
export class ServiciosTecnicoPage implements OnInit {

  // Datos de ejemplo. En una app real, vendrían de un servicio.
  public servicios = [
    { codigoOT: 'COD-001', servicio: 'Mantenimiento preventivo', estado: 'En proceso', encargadoPor: 'Juan Pérez' },
    { codigoOT: 'COD-002', servicio: 'Reparación de motor', estado: 'Finalizado', encargadoPor: 'Ana Gómez' },
    { codigoOT: 'COD-003', servicio: 'Cambio de neumáticos', estado: 'Pendiente', encargadoPor: 'Carlos Díaz' },
    { codigoOT: 'COD-004', servicio: 'Ajuste de frenos', estado: 'En proceso', encargadoPor: 'Maria Torres' },
    { codigoOT: 'COD-005', servicio: 'Revisión general', estado: 'Finalizado', encargadoPor: 'Luis Martinez' }
  ];

  constructor(private router: Router) {
    addIcons({
      'arrow-forward': arrowForwardOutline
    });
  }

  ngOnInit() {
  }

  verDetalle(servicio: any) {
    // Navegamos a la página de detalle, pasando el código de la OT como parámetro
    // Esta ruta debe coincidir con la que definiste en app.routes.ts
    this.router.navigate(['/servicio-detalle', servicio.codigoOT]);
  }

  getStatusColor(estado: string): string {
    switch (estado.toLowerCase()) {
      case 'en proceso': return 'warning';
      case 'finalizado': return 'success';
      case 'pendiente': return 'medium';
      default: return 'primary';
    }
  }
}