import '/src/paginas/dashboard.scss';

export default function renderizarDashboard(contenedor) {
  contenedor.innerHTML = `

  <ion-header class="dashboard-header">
  <ion-toolbar>
    <div class="header-left">
      <h1>Dashboard <ion-icon name="person-outline"></ion-icon></h1>
    </div>

    <div class="header-right">
      <span class="last-update">⟳ 0 minutos</span>

      <ion-select value="Concepción">
        <ion-select-option value="Concepción">Concepción</ion-select-option>
        <ion-select-option value="Lota">Lota / Lota</ion-select-option>
      </ion-select>

      <ion-button fill="outline" size="small">Compacto</ion-button>

      <ion-button fill="outline" size="small">
        <ion-icon slot="start" name="grid-outline"></ion-icon>
        Administrar Widgets
        <ion-icon slot="end" name="chevron-down-outline"></ion-icon>
      </ion-button>

      <ion-button fill="clear" size="small">
        <ion-icon name="expand-outline"></ion-icon>
      </ion-button>
    </div>
  </ion-toolbar>
</ion-header>

    <ion-grid id="dashboard-grid">
      <!-- Primera fila: Tres cartas -->
      <ion-row id="fila1">
        <!-- Carta: Camiones en Mantenimiento (Pastel) -->
        <ion-col size="12" size-md="4">
          <ion-card>
            <ion-card-header class="card-handle">
              <ion-card-title>Camiones en Mantenimiento</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <canvas id="chartMaintenance"></canvas>
            </ion-card-content>
          </ion-card>
        </ion-col>
        <!-- Carta: Rendimiento Promedio de Combustible (Barras) -->
        <ion-col size="12" size-md="4">
          <ion-card>
            <ion-card-header class="card-handle">
              <ion-card-title>Rendimiento Promedio de Combustible (Km/l)</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <canvas id="chartFuelEfficiency"></canvas>
            </ion-card-content>
          </ion-card>
        </ion-col>
        <!-- Carta: Kilometraje Promedio por Servicio (Líneas) -->
        <ion-col size="12" size-md="4">
          <ion-card>
            <ion-card-header class="card-handle">
              <ion-card-title>Kilometraje Promedio por Servicio</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <canvas id="chartAvgMileage"></canvas>
            </ion-card-content>
          </ion-card>
        </ion-col>
      </ion-row>
      <!-- Segunda fila: Tres cartas -->
      <ion-row id="fila2">
        <!-- Carta: Costo Promedio de Mantenimiento (Dona) -->
        <ion-col size="12" size-md="4">
          <ion-card>
            <ion-card-header class="card-handle">
              <ion-card-title>Costo Promedio de Mantenimiento</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <canvas id="chartMaintenanceCost"></canvas>
            </ion-card-content>
          </ion-card>
        </ion-col>
        <!-- Carta: Disponibilidad de Vehículos (Radar) -->
        <ion-col size="12" size-md="4">
          <ion-card>
            <ion-card-header class="card-handle">
              <ion-card-title>Disponibilidad de Vehículos</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <canvas id="chartVehicleAvailability"></canvas>
            </ion-card-content>
          </ion-card>
        </ion-col>
        <!-- Carta: Métrica Extra (Ejemplo: Eficiencia Promedio de Mantenimiento) -->
        <ion-col size="12" size-md="4">
          <ion-card>
            <ion-card-header class="card-handle">
              <ion-card-title>Eficiencia Promedio de Mantenimiento</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <canvas id="chartExtraMetric"></canvas>
            </ion-card-content>
          </ion-card>
        </ion-col>
      </ion-row>
    </ion-grid>
  `;

  // Gráfico 1: Camiones en Mantenimiento (Pastel)
  const ctxMaintenance = document.getElementById('chartMaintenance').getContext('2d');
  new Chart(ctxMaintenance, {
    type: 'pie',
    data: {
      labels: ['En Mantenimiento', 'Operativos'],
      datasets: [{
        data: [5, 15],
        backgroundColor: ['#FF6384', '#36A2EB']
      }]
    },
    options: {
      responsive: true
    }
  });

  // Gráfico 2: Rendimiento Promedio de Combustible (Barras)
  const ctxFuelEfficiency = document.getElementById('chartFuelEfficiency').getContext('2d');
  new Chart(ctxFuelEfficiency, {
    type: 'bar',
    data: {
      labels: ['Camión 1', 'Camión 2', 'Camión 3', 'Camión 4'],
      datasets: [{
        label: 'Km/l',
        data: [3.5, 4.2, 3.8, 4.0],
        backgroundColor: '#FFCE56'
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });

  // Gráfico 3: Kilometraje Promedio por Servicio (Líneas)
  const ctxAvgMileage = document.getElementById('chartAvgMileage').getContext('2d');
  new Chart(ctxAvgMileage, {
    type: 'line',
    data: {
      labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo'],
      datasets: [{
        label: 'Km',
        data: [1500, 1600, 1550, 1700, 1650],
        borderColor: '#4BC0C0',
        fill: false
      }]
    },
    options: {
      responsive: true
    }
  });

  // Gráfico 4: Costo Promedio de Mantenimiento (Dona)
  const ctxMaintenanceCost = document.getElementById('chartMaintenanceCost').getContext('2d');
  new Chart(ctxMaintenanceCost, {
    type: 'doughnut',
    data: {
      labels: ['Mano de Obra', 'Repuestos', 'Otros'],
      datasets: [{
        data: [40, 35, 25],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
      }]
    },
    options: {
      responsive: true
    }
  });

  // Gráfico 5: Disponibilidad de Vehículos (Radar)
  const ctxVehicleAvailability = document.getElementById('chartVehicleAvailability').getContext('2d');
  new Chart(ctxVehicleAvailability, {
    type: 'radar',
    data: {
      labels: ['Disponibles', 'En Mantenimiento', 'En Ruta', 'Reservados'],
      datasets: [{
        label: 'Vehículos',
        data: [20, 5, 10, 3],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: '#36A2EB',
        pointBackgroundColor: '#36A2EB'
      }]
    },
    options: {
      responsive: true,
      scales: {
        r: { beginAtZero: true }
      }
    }
  });

  // Gráfico 6: Métrica Extra (Ejemplo: Eficiencia Promedio de Mantenimiento)
  const ctxExtraMetric = document.getElementById('chartExtraMetric').getContext('2d');
  new Chart(ctxExtraMetric, {
    type: 'bar',
    data: {
      labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo'],
      datasets: [{
        label: 'Eficiencia (%)',
        data: [85, 88, 82, 90, 87],
        backgroundColor: '#8e44ad'
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, max: 100 }
      }
    }
  });

  // Inicializar SortableJS para que se puedan mover las columnas dentro de cada fila
  Sortable.create(document.getElementById('fila1'), {
    animation: 150,
    handle: '.card-handle', // se usa el header de la carta como handle de arrastre
    draggable: 'ion-col'
  });
  Sortable.create(document.getElementById('fila2'), {
    animation: 150,
    handle: '.card-handle',
    draggable: 'ion-col'
  });
}
