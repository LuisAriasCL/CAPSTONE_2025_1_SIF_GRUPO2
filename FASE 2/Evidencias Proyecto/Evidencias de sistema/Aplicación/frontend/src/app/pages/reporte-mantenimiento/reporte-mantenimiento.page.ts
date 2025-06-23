// frontend/src/app/pages/reporte-mantenimiento/reporte-mantenimiento.page.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { HeaderComponent } from 'src/app/componentes/header/header.component';
import { ApiService, Vehiculo } from 'src/app/services/api.service';
import { addIcons } from 'ionicons';
import { downloadOutline, filterOutline, closeCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-reporte-mantenimiento',
  templateUrl: './reporte-mantenimiento.page.html',
  styleUrls: ['./reporte-mantenimiento.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, HeaderComponent, DatePipe]
})
export class ReporteMantenimientoPage implements OnInit {

  public reporteData: any[] = [];
  public vehiculos: Vehiculo[] = [];
  public isLoading = true;
  public filtros = {
    fechaDesde: '',
    fechaHasta: '',
    vehiculoId: null
  };

  constructor(
    private apiService: ApiService,
    private toastController: ToastController
  ) {
    addIcons({ downloadOutline, filterOutline, closeCircleOutline });
  }

  ngOnInit() {
    this.cargarVehiculos();
    this.cargarReporte();
  }

  cargarVehiculos() {
    this.apiService.getVehicles().subscribe({
      next: (data) => this.vehiculos = data,
      error: (err) => console.error('Error al cargar vehículos', err)
    });
  }

  cargarReporte() {
    this.isLoading = true;
    this.apiService.getMantenimientoReport(this.filtros).subscribe({
      next: (data) => {
        this.reporteData = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar el reporte', err);
        this.isLoading = false;
        this.mostrarToast('Error al cargar el reporte.', 'danger');
      }
    });
  }

  aplicarFiltros() {
    this.cargarReporte();
  }

  limpiarFiltros() {
    this.filtros = {
      fechaDesde: '',
      fechaHasta: '',
      vehiculoId: null
    };
    this.cargarReporte();
  }

  exportarCSV() {
    if (this.reporteData.length === 0) {
      this.mostrarToast('No hay datos para exportar.', 'warning');
      return;
    }

    const cabeceras = [
      'ID OT', 'Patente Vehículo', 'Marca', 'Modelo', 'Descripción', 'Encargado',
      'Fecha Inicio', 'Fecha Fin', 'Estado'
    ];
    
    let csvContent = cabeceras.join(',') + '\r\n';

    this.reporteData.forEach(row => {
      const encargado = row.encargado ? `${row.encargado.pri_nom_usu} ${row.encargado.pri_ape_usu}` : 'No asignado';
      const fechaInicio = row.fec_ini_ot ? new Date(row.fec_ini_ot).toLocaleDateString() : 'N/A';
      const fechaFin = row.fec_fin_ot ? new Date(row.fec_fin_ot).toLocaleDateString() : 'N/A';
      
      const fila = [
        row.id_ot,
        row.vehiculo?.patente || 'N/A',
        row.vehiculo?.marca || 'N/A',
        row.vehiculo?.modelo || 'N/A',
        `"${row.descripcion_ot.replace(/"/g, '""')}"`, // Escapar comillas dobles
        `"${encargado}"`,
        fechaInicio,
        fechaFin,
        row.estado_ot
      ];
      csvContent += fila.join(',') + '\r\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "reporte_mantenimientos.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
  
  // Función auxiliar para mostrar mensajes
  async mostrarToast(mensaje: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 3000,
      color: color
    });
    toast.present();
  }
}