import { Component, Input, OnInit } from '@angular/core';
import { ModalController, IonModal } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon, IonButton } from '@ionic/angular/standalone';

// Botones de alerta personalizados
import { AlertButton, AlertIconType } from 'src/types/components.types';

@Component({
  selector: 'app-alerta-personalizada',
  templateUrl: './alerta-personalizada.component.html',
  styleUrls: ['./alerta-personalizada.component.scss'],
  standalone: true,
  imports: [ 
    CommonModule,
    IonIcon,
    IonButton
  ]
})
export class AlertaPersonalizadaComponent implements OnInit {

  @Input() title: string = ''; // Título por defecto
  @Input() message: string = ''; // Mensaje
  @Input() icon: AlertIconType = AlertIconType.Success; // Ícono(success por defecto)
  @Input() buttons: AlertButton[] = []; // Botones de alerta

  iconName: string = ''; // Nombre del icono de Ionicons

  constructor(private modalCtrl: ModalController) {}

  // Función de mapeo de iconos para los tipos de alerta
  private readonly iconMap: Record<AlertIconType, string> = {
  warning: 'warning-outline',
  success: 'checkmark-circle-outline',
  error: 'close-circle-outline',
  info: 'information-circle-outline',
  help: 'help-circle-outline',
  logout: 'log-out-outline'
};

  ngOnInit() {
    // Asigna el nombre del icono basado en el tipo de alerta
    this.iconName = this.iconMap[this.icon];
  }

  // Método para manejar el clic en un botón
  handleButtonClick(button: AlertButton) {
    this.modalCtrl.dismiss(button.role);
  }

  // Método opcional para cerrar si se hace clic fuera (si el backdrop está habilitado)
  dismissModal() {
    this.modalCtrl.dismiss('backdrop');
  }
}
