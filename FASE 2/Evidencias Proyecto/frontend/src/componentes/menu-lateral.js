import '../assets/estilos/menu-lateral.scss';

class MenuLateral extends HTMLElement {
  connectedCallback() {
    this.render();
    this.setupMenuBehavior();
  }

  setupMenuBehavior() {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);

    if (!isMobile) {
      // En escritorio, reemplazar el ion-menu con un div estático
      const menuContent = this.querySelector('ion-menu').innerHTML;
      this.innerHTML = `
        <div class="sidebar-static">
          ${menuContent}
        </div>
      `;
    } else {
      // En móvil, mantener el menú original y asegurarse de que funcione
      this.classList.add('menu-mobile');
    }
  }

  render() {
    this.innerHTML = `
       <ion-menu side="start" menu-id="first" content-id="main-content" class="menu-blue">
        <ion-header>
          <ion-toolbar class="menu-blue-header">
              <div class="menu-title-container">
                <div class="menu-title">
                  Gestor de Flota
                  <span class="arrow">▼</span>
                </div>
                <div class="menu-subtitle">Gerardo Henriquez San Martin</div>
              </div>
                <div class="menu-profile">
            <img src="src/assets/img/perfil_ejemplo.jpg" alt="Perfil" class="menu-profile-img" />
            </div>
          </ion-toolbar>
        </ion-header>
        <ion-content class="menu-blue-content">
          <ion-list class="menu-blue-list">
            <ion-item button href="#/dashboard" class="menu-blue-item">
              <ion-icon slot="start" name="speedometer-outline" class="menu-blue-icon"></ion-icon>
              <ion-label class="menu-blue-label">Dashboard</ion-label>
            </ion-item>
            <ion-item button href="#/reportes" class="menu-blue-item">
              <ion-icon slot="start" name="pie-chart-outline" class="menu-blue-icon"></ion-icon>
              <ion-label class="menu-blue-label">Reportes</ion-label>
            </ion-item>
            <ion-item button href="#/mantenciones" class="menu-blue-item">
              <ion-icon slot="start" name="hammer-outline" class="menu-blue-icon"></ion-icon>
              <ion-label class="menu-blue-label">Mantenciones</ion-label>
            </ion-item>
            <ion-item button href="#/combustible" class="menu-blue-item">
              <ion-icon slot="start" name="battery-charging-outline" class="menu-blue-icon"></ion-icon>
              <ion-label class="menu-blue-label">Combustible</ion-label>
            </ion-item>
            <ion-item button href="#/checklists" class="menu-blue-item">
              <ion-icon slot="start" name="clipboard-outline" class="menu-blue-icon"></ion-icon>
              <ion-label class="menu-blue-label">Checklists</ion-label>
            </ion-item>
            <ion-item button href="#/vehiculos" class="menu-blue-item">
              <ion-icon slot="start" name="car-sport-outline" class="menu-blue-icon"></ion-icon>
              <ion-label class="menu-blue-label">Vehículos</ion-label>
            </ion-item>
            <ion-item button href="#/proyectos" class="menu-blue-item">
              <ion-icon slot="start" name="briefcase-outline" class="menu-blue-icon"></ion-icon>
              <ion-label class="menu-blue-label">Proyectos</ion-label>
            </ion-item>
            <ion-item button href="#/conductores" class="menu-blue-item">
              <ion-icon slot="start" name="people-outline" class="menu-blue-icon"></ion-icon>
              <ion-label class="menu-blue-label">Conductores</ion-label>
            </ion-item>
            <ion-item button href="#/recorridos" class="menu-blue-item">
              <ion-icon slot="start" name="map-outline" class="menu-blue-icon"></ion-icon>
              <ion-label class="menu-blue-label">Recorridos</ion-label>
            </ion-item>
            <ion-item button href="#/documentos" class="menu-blue-item">
              <ion-icon slot="start" name="document-outline" class="menu-blue-icon"></ion-icon>
              <ion-label class="menu-blue-label">Documentos</ion-label>
            </ion-item>
            <ion-item button href="#/recordatorios" class="menu-blue-item">
              <ion-icon slot="start" name="alarm-outline" class="menu-blue-icon"></ion-icon>
              <ion-label class="menu-blue-label">Recordatorios</ion-label>
            </ion-item>
            <ion-item button href="#/accidentes" class="menu-blue-item">
              <ion-icon slot="start" name="warning-outline" class="menu-blue-icon"></ion-icon>
              <ion-label class="menu-blue-label">Accidentes</ion-label>
            </ion-item>
          </ion-list>
        </ion-content>
      </ion-menu>
      <div id="main-content">
        <!-- Contenido principal de la aplicación -->
      </div>
    `;
  }
}

// Definir el elemento personalizado 'menu-lateral-app'
customElements.define('menu-lateral-app', MenuLateral);