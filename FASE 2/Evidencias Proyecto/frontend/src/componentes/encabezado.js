import { menuController } from '@ionic/core'; // Importar el controlador de menú de Ionic
import '../assets/estilos/encabezado.scss'; // Importar estilos CSS para el encabezado

class Encabezado extends HTMLElement {
  connectedCallback() {
    this.render(); // Renderizar el encabezado
    this.colocarBotonMenu(); // Configurar el comportamiento del botón de menú
  }

  colocarBotonMenu() {
    const menuBoton = this.querySelector('ion-menu-button');
    if (menuBoton) {
      menuBoton.addEventListener('click', async () => {
        // Abrir el menú al hacer clic en el botón
        await menuController.open('first');
      });
    }
  }

  render() {
    this.innerHTML = `
       <ion-header class="encabezado">
         <ion-toolbar color="primary">
           <div class="logo-container">
             <img src="src/assets/img/logo.png" alt="Logo SIF" class="logo-img" />
             <span class="logo-text">Sistema Integral de Flota</span>
           </div>
           <ion-buttons slot="start">
             <ion-menu-button menu="first"></ion-menu-button>
           </ion-buttons>
           <ion-buttons slot="end" class="right-buttons-container">
             <!-- Se listan en orden natural: FAQ, Notificaciones, Settings -->
             <ion-button fill="clear">
               <ion-icon name="help-outline"></ion-icon>
             </ion-button>
             <ion-button fill="clear">
               <ion-icon name="notifications-outline"></ion-icon>
             </ion-button>
             <ion-button fill="clear">
               <ion-icon name="settings-outline"></ion-icon>
             </ion-button>
           </ion-buttons>
         </ion-toolbar>
       </ion-header>
       `;
  }
}

customElements.define('encabezado-app', Encabezado);