import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { checkmarkDoneOutline } from 'ionicons/icons';

@Component({
  selector: 'app-servicio-detalle',
  templateUrl: './servicio-detalle.page.html',
  styleUrls: ['./servicio-detalle.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
  providers: [DatePipe] // Para usar el pipe 'date' en el template
})
export class ServicioDetallePage implements OnInit {
  
  public ordenDeTrabajo: any;
  private otId: string | null = null;

  constructor(private route: ActivatedRoute) {
    addIcons({
      'checkmark-done': checkmarkDoneOutline
    });
  }

  ngOnInit() {
    // Obtenemos el ID de la OT desde la URL
    this.otId = this.route.snapshot.paramMap.get('id');
    // En una app real, llamarías a un servicio: this.miServicio.getOT(this.otId).subscribe(data => ...);

    // Por ahora, usamos datos de ejemplo para que la vista funcione:
    this.cargarDatosDeEjemplo(this.otId);
  }

  cargarDatosDeEjemplo(id: string | null) {
    // Simula que se cargan los datos de la OT seleccionada
    this.ordenDeTrabajo = {
      codigoOT: id,
      descripcionGeneral: 'Sacar el aceite del motor y poner uno nuevo.',
      encargadoOT: 'Jaime Castillo',
      fechaInicio: new Date('2025-06-12T12:00:00'),
      fechaFin: new Date('2025-06-12T12:30:00'),
      duracionAprox: 30,
      duracionReal: null, // Podría ser null si aún no se completa
      descripcionTarea: 'Se realiza cambio de aceite según pauta de mantenimiento preventivo para el vehículo, utilizando aceite sintético 5W-30.'
    };
  }
}