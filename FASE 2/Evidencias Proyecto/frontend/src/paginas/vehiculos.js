import '/src/paginas/vehiculos.scss';

export default function renderizarDashboard(contenedor) {
  contenedor.innerHTML = `

  <ion-header>
    <ion-toolbar>
      <ion-title>Vehículos</ion-title>
    </ion-toolbar>
  </ion-header>

  <div class="vehicle-header">
    <img src="ruta/imagen-camion.jpg" alt="Camión" class="vehicle-image" />
    <div class="vehicle-info">
      <h2>BL102</h2>
      <p>Camión Semirremolque · 2012 Freightliner Cascadia 113 · 1FUBGADV8CLBJ9848</p>
      <div class="info-row">
        <a href="#">288 mi</a>
        <span class="status-dot active"></span>
        <span>Birmingham</span>
        <span>No asignado</span>
      </div>
      <ion-button size="small" fill="outline">Editar Etiquetas</ion-button>
    </div>
  </div>

  <ion-segment value="overview">
    <ion-segment-button value="overview">Resumen</ion-segment-button>
    <ion-segment-button value="specs">Especificaciones</ion-segment-button>
    <ion-segment-button value="financial">Financiero</ion-segment-button>
    <ion-segment-button value="warranties">Garantías</ion-segment-button>
    <ion-segment-button value="tires">Gestión de Neumáticos</ion-segment-button>
    <ion-segment-button value="tire-activity">Actividad de Neumáticos</ion-segment-button>
    <ion-segment-button value="telematics">Telemática</ion-segment-button>
    <ion-segment-button value="service-history">Historial de Servicio</ion-segment-button>
  </ion-segment>

  <div class="details-section">
    <div class="details-box">
      <h3>Detalles</h3>
      <ul>
        <li><strong>Nombre:</strong> BL102</li>
        <li><strong>Kilometraje:</strong> <a href="#">288 mi</a></li>
        <li><strong>Estado:</strong> <span class="status-dot active"></span> Activo</li>
        <li><strong>Estado de Integración Automática:</strong> Habilitado - Pendiente</li>
        <li><strong>Grupo:</strong> Birmingham</li>
        <li><strong>Operador:</strong> No asignado</li>
        <li><strong>Tipo:</strong> Camión Semirremolque</li>
        <li><strong>Tipo de Combustible:</strong> —</li>
      </ul>
    </div>

    <div class="cost-section">
      <h3>Costo de Propiedad</h3>
      <div class="cost-info">
        <p><strong>Costos Totales:</strong> $52,682.31</p>
        <p><strong>Costo por Milla:</strong> $182.92 / mi</p>
      </div>
      <img src="ruta/grafico-costos.png" alt="Gráfico de costos" />
      <ul class="cost-breakdown">
        <li><span class="dot fuel"></span> Costos de Combustible: $51,877.27</li>
        <li><span class="dot service"></span> Costos de Servicio: $590.53</li>
        <li><span class="dot other"></span> Otros Costos: $214.51</li>
      </ul>
    </div>
  </div>
  `;
}