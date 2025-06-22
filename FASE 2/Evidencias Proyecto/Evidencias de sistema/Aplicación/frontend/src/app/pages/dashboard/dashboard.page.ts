import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, ChartType, registerables } from 'chart.js';
import { ApiService } from 'src/app/core/services/api.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, PageHeaderComponent, BaseChartDirective]
})
export class DashboardPage implements OnInit {

  isPieChartLoading = true;
  isBarChartLoading = true;

  // --- Gráfico de Torta (Tipos de Vehículo) ---
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'bottom', 
      },
    
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const sum = context.chart.data.datasets[0].data.reduce((a, b) => (a as number) + (b as number), 0) as number;
            const percentage = sum > 0 ? ((value / sum) * 100).toFixed(1) + '%' : '0%';
            return `${label}: ${value} (${percentage})`;
          }
        }
      }
    }
  };
  public pieChartData: ChartData<'pie', number[], string | string[]> = {
    labels: [],
    datasets: [{
      data: [],
      
      backgroundColor: ['#428cff', '#32d7a3', '#5260ff', '#2dd36f', '#ffc409', '#ff8409', '#eb445a'],
      hoverBackgroundColor: ['#589eff', '#48e4b3', '#6875ff', '#43e080', '#ffd03b', '#ff963b', '#ed576b'],
      borderWidth: 1
    }]
  };
  public pieChartType: ChartType = 'pie';
  
  // --- Gráfico de Barras (Estado de Mantenimientos) ---
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    scales: {
      x: {},
      y: {
        min: 0,
        ticks: { 
          stepSize: 1
        }
      }
    },
    plugins: {
      legend: { display: false }, 
      tooltip: {
        callbacks: {
          label: function(context) {
            return ` Órdenes: ${context.parsed.y}`;
          }
        }
      }
    }
  };
  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Órdenes de Trabajo',
     
      backgroundColor: [], 
      borderColor: [],
      borderWidth: 1,
      borderRadius: 5
    }]
  };
  public barChartType: ChartType = 'bar';

  constructor(private apiService: ApiService) {
    Chart.register(...registerables);
  }

  ngOnInit() {
    this.cargarDatosGraficos();
  }

  cargarDatosGraficos() {
    this.cargarPieChart();
    this.cargarBarChart();
  }

  cargarPieChart() {
    this.isPieChartLoading = true;
    this.apiService.getStatsVehiculosPorTipo().subscribe({
      next: (data) => {
        if (data?.labels?.length) {
          this.pieChartData.labels = data.labels;
          this.pieChartData.datasets[0].data = data.data;
        }
        this.isPieChartLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar datos del pie chart', err);
        this.isPieChartLoading = false;
      }
    });
  }

  cargarBarChart() {
    this.isBarChartLoading = true;
    this.apiService.getStatsMantenimientosPorEstado().subscribe({
      next: (data) => {
        if (data?.labels?.length) {
          this.barChartData.labels = data.labels;
          this.barChartData.datasets[0].data = data.data;

         
          const backgroundColors = data.labels.map((label: string) => {
            if (label.toLowerCase().includes('progreso')) return 'rgba(255, 196, 9, 0.7)'; // Warning (Amarillo)
            if (label.toLowerCase().includes('completado')) return 'rgba(45, 211, 111, 0.7)'; // Success (Verde)
            if (label.toLowerCase().includes('solicitado')) return 'rgba(56, 128, 255, 0.7)'; // Primary (Azul)
            return 'rgba(150, 150, 150, 0.7)'; 
          });

          const borderColors = backgroundColors.map((color: string) => color.replace('0.7', '1'));

          this.barChartData.datasets[0].backgroundColor = backgroundColors;
          this.barChartData.datasets[0].borderColor = borderColors;
        }
        this.isBarChartLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar datos del bar chart', err);
        this.isBarChartLoading = false;
      }
    });
  }
}
