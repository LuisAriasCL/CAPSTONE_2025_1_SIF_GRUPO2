import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { BaseChartDirective } from 'ng2-charts';
import {
  Chart,
  ChartConfiguration,
  ChartData,
  ChartType,
  registerables,
} from 'chart.js';
import { ApiService } from 'src/app/services/api.service';
import { TitleService } from 'src/app/services/title.service';
import { addIcons } from 'ionicons';
import {
  carSportOutline,
  shieldCheckmarkOutline,
  buildOutline,
  alertCircleOutline,
  timerOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, BaseChartDirective],
})
export class DashboardPage implements OnInit {
  // --- NUEVAS PROPIEDADES PARA LAS TARJETAS DE KPIS ---
  public kpis: any = null;
  public isKpisLoading = true;
  // ---------------------------------------------------

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
          label: function (context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const sum = context.chart.data.datasets[0].data.reduce(
              (a, b) => (a as number) + (b as number),
              0
            ) as number;
            const percentage =
              sum > 0 ? ((value / sum) * 100).toFixed(1) + '%' : '0%';
            return `${label}: ${value} (${percentage})`;
          },
        },
      },
    },
  };
  public pieChartData: ChartData<'pie', number[], string | string[]> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [
          '#428cff',
          '#32d7a3',
          '#5260ff',
          '#2dd36f',
          '#ffc409',
          '#ff8409',
          '#eb445a',
        ],
        hoverBackgroundColor: [
          '#589eff',
          '#48e4b3',
          '#6875ff',
          '#43e080',
          '#ffd03b',
          '#ff963b',
          '#ed576b',
        ],
        borderWidth: 1,
      },
    ],
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
          stepSize: 1,
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function (context) {
            return ` Órdenes: ${context.parsed.y}`;
          },
        },
      },
    },
  };
  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Órdenes de Trabajo',
        backgroundColor: [],
        borderColor: [],
        borderWidth: 1,
        borderRadius: 5,
      },
    ],
  };
  public barChartType: ChartType = 'bar';

  constructor(
    private apiService: ApiService,
    private titleService: TitleService
  ) {
    Chart.register(...registerables);
    addIcons({
      carSportOutline,
      shieldCheckmarkOutline,
      buildOutline,
      alertCircleOutline,
      timerOutline,
    });
  }
  ngOnInit() {
    // --- CAMBIO: ngOnInit ahora llama a la función principal de carga ---
    this.titleService.setTitle('Dashboard - Gestión de Flota');
    this.cargarDashboard();
  }

  // Usar ionViewWillEnter para recargar datos cada vez que se entra en la página
  ionViewWillEnter() {
    this.cargarDashboard();
  }

  // --- FUNCIÓN MEJORADA PARA CARGAR TODOS LOS DATOS ---
  cargarDashboard() {
    this.cargarKpis();
    this.cargarPieChart();
    this.cargarBarChart();
  }

  // --- NUEVA FUNCIÓN PARA CARGAR LAS TARJETAS ---
  cargarKpis() {
    this.isKpisLoading = true;
    this.apiService.getDashboardKpis().subscribe({
      next: (data) => {
        this.kpis = data;
        this.isKpisLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar KPIs del dashboard', err);
        this.isKpisLoading = false;
      },
    });
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
      },
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
            if (label.toLowerCase().includes('en progreso'))
              return 'rgba(255, 196, 9, 0.7)';
            if (label.toLowerCase().includes('completada'))
              return 'rgba(45, 211, 111, 0.7)';
            if (label.toLowerCase().includes('asignada'))
              return 'rgba(113, 73, 255, 0.7)'; // Violeta para asignado
            if (label.toLowerCase().includes('pendiente'))
              return 'rgba(56, 128, 255, 0.7)';
            return 'rgba(150, 150, 150, 0.7)';
          });

          const borderColors = backgroundColors.map((color: string) =>
            color.replace('0.7', '1')
          );
          this.barChartData.datasets[0].backgroundColor = backgroundColors;
          this.barChartData.datasets[0].borderColor = borderColors;
        }
        this.isBarChartLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar datos del bar chart', err);
        this.isBarChartLoading = false;
      },
    });
  }
}
