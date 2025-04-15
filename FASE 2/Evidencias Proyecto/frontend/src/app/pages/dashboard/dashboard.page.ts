import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { IonicModule } from '@ionic/angular';


import { Chart, registerables } from 'chart.js/auto';
import Sortable from 'sortablejs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule] 
})
export class DashboardPage implements OnInit, AfterViewInit, OnDestroy {


  @ViewChild('chartMaintenanceCanvas') chartMaintenanceCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartFuelEfficiencyCanvas') chartFuelEfficiencyCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartAvgMileageCanvas') chartAvgMileageCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartMaintenanceCostCanvas') chartMaintenanceCostCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartVehicleAvailabilityCanvas') chartVehicleAvailabilityCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartExtraMetricCanvas') chartExtraMetricCanvasRef!: ElementRef<HTMLCanvasElement>;

   
   @ViewChild('fila1') fila1Ref!: ElementRef<HTMLIonRowElement>;
   @ViewChild('fila2') fila2Ref!: ElementRef<HTMLIonRowElement>;


  private charts: Chart[] = [];
  private sortableInstances: Sortable[] = [];

  constructor() {
    
  }

  ngOnInit() {
    // Lógica inicial si la hubiera (ej. preparar datos iniciales)
  }

  ngAfterViewInit() {
    // Es el mejor lugar para inicializar gráficos y SortableJS
    // porque los elementos del DOM (canvas, ion-row) ya están disponibles.
    console.log("DashboardPage: ngAfterViewInit - Inicializando gráficos y sortable...");
    this.initializeCharts();
    this.initializeSortable();
  }

  ngOnDestroy() {
    // IMPORTANTE: Destruir instancias para liberar memoria
    console.log("DashboardPage: ngOnDestroy - Destruyendo gráficos y sortable...");
    this.charts.forEach(chart => chart.destroy());
    this.sortableInstances.forEach(sortable => sortable.destroy());
    this.charts = [];
    this.sortableInstances = [];
  }

  initializeCharts() {
     try {
         // Usamos los datos estáticos de tu ejemplo por ahora
         // En el futuro, estos datos vendrían de un servicio (ApiService)

        // Gráfico 1: Mantenimiento (Pastel)
        const ctxMaintenance = this.chartMaintenanceCanvasRef.nativeElement.getContext('2d');
        if (ctxMaintenance) {
          const chart = new Chart(ctxMaintenance, { /* ... config Gráfico 1 como en tu JS ... */
            type: 'pie',
            data: { labels: ['En Mantenimiento', 'Operativos'], datasets: [{ data: [5, 15], backgroundColor: ['#FF6384', '#36A2EB'] }] },
            options: { responsive: true, maintainAspectRatio: false }
           });
          this.charts.push(chart);
        }

        // Gráfico 2: Rendimiento Combustible (Barras)
        const ctxFuelEfficiency = this.chartFuelEfficiencyCanvasRef.nativeElement.getContext('2d');
         if (ctxFuelEfficiency) {
           const chart = new Chart(ctxFuelEfficiency, { /* ... config Gráfico 2 como en tu JS ... */
                type: 'bar',
                data: { labels: ['Camión 1', 'Camión 2', 'Camión 3', 'Camión 4'], datasets: [{ label: 'Km/l', data: [3.5, 4.2, 3.8, 4.0], backgroundColor: '#FFCE56' }] },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
            });
            this.charts.push(chart);
         }

         // Gráfico 3: Kilometraje (Líneas)
         const ctxAvgMileage = this.chartAvgMileageCanvasRef.nativeElement.getContext('2d');
         if (ctxAvgMileage) {
            const chart = new Chart(ctxAvgMileage, { /* ... config Gráfico 3 como en tu JS ... */
                type: 'line',
                data: { labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo'], datasets: [{ label: 'Km', data: [1500, 1600, 1550, 1700, 1650], borderColor: '#4BC0C0', fill: false }] },
                options: { responsive: true, maintainAspectRatio: false }
            });
            this.charts.push(chart);
         }

          // Gráfico 4: Costo Mantenimiento (Dona)
          const ctxMaintenanceCost = this.chartMaintenanceCostCanvasRef.nativeElement.getContext('2d');
          if (ctxMaintenanceCost) {
            const chart = new Chart(ctxMaintenanceCost, { /* ... config Gráfico 4 como en tu JS ... */
                type: 'doughnut',
                data: { labels: ['Mano de Obra', 'Repuestos', 'Otros'], datasets: [{ data: [40, 35, 25], backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'] }] },
                options: { responsive: true, maintainAspectRatio: false }
              });
              this.charts.push(chart);
          }

          // Gráfico 5: Disponibilidad (Radar)
          const ctxVehicleAvailability = this.chartVehicleAvailabilityCanvasRef.nativeElement.getContext('2d');
          if (ctxVehicleAvailability) {
             const chart = new Chart(ctxVehicleAvailability, { /* ... config Gráfico 5 como en tu JS ... */
                type: 'radar',
                data: { labels: ['Disponibles', 'En Mantenimiento', 'En Ruta', 'Reservados'], datasets: [{ label: 'Vehículos', data: [20, 5, 10, 3], backgroundColor: 'rgba(54, 162, 235, 0.2)', borderColor: '#36A2EB', pointBackgroundColor: '#36A2EB' }] },
                options: { responsive: true, maintainAspectRatio: false, scales: { r: { beginAtZero: true } } }
              });
              this.charts.push(chart);
          }

           // Gráfico 6: Métrica Extra (Barra)
          const ctxExtraMetric = this.chartExtraMetricCanvasRef.nativeElement.getContext('2d');
           if (ctxExtraMetric) {
              const chart = new Chart(ctxExtraMetric, { /* ... config Gráfico 6 como en tu JS ... */
                type: 'bar',
                data: { labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo'], datasets: [{ label: 'Eficiencia (%)', data: [85, 88, 82, 90, 87], backgroundColor: '#8e44ad' }] },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } } }
              });
              this.charts.push(chart);
           }

         console.log("Gráficos inicializados.");
     } catch(error) {
         console.error("Error inicializando los gráficos:", error);
     }
  }

  initializeSortable() {
      try {
          if (this.fila1Ref?.nativeElement) {
              const sortable1 = Sortable.create(this.fila1Ref.nativeElement, {
                  animation: 150,
                  handle: '.card-handle', // Clase CSS del elemento para arrastrar
                  draggable: 'ion-col', // Qué elementos dentro del contenedor son arrastrables
                  // Opciones adicionales si las necesitas
              });
              this.sortableInstances.push(sortable1);
          }
          if (this.fila2Ref?.nativeElement) {
               const sortable2 = Sortable.create(this.fila2Ref.nativeElement, {
                  animation: 150,
                  handle: '.card-handle',
                  draggable: 'ion-col'
              });
               this.sortableInstances.push(sortable2);
          }
           console.log("SortableJS inicializado para filas.");
      } catch(error) {
           console.error("Error inicializando SortableJS:", error);
      }
  }
}