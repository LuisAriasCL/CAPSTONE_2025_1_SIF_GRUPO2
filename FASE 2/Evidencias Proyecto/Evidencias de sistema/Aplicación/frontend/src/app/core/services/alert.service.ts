import { Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular/standalone';
import { AlertaPersonalizadaComponent, AlertButton } from '../../shared/components/alerta-personalizada/alerta-personalizada.component';

export interface AlertOptions {
  title: string;
  message: string;
  icon?: 'warning' | 'success' | 'error' | 'info' | 'help' | 'logout';
  buttons?: AlertButton[];
  backdropDismiss?: boolean;
  cssClass?: string;
}

export interface ConfirmOptions extends AlertOptions {
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean; // Para acciones de eliminación o peligrosas
}

/**
 * Servicio centralizado para gestionar alertas y confirmaciones en la aplicación.
 * Utiliza AlertaPersonalizadaComponent internamente para mostrar alertas personalizadas.
 */
@Injectable({
  providedIn: 'root'
})
export class AlertService {
  constructor(
    private modalCtrl: ModalController,
    private alertCtrl: AlertController
  ) {}

  /**
   * Muestra una alerta simple con un botón "Aceptar"
   */
  async showAlert(options: AlertOptions): Promise<void> {
    const defaultOptions: Partial<AlertOptions> = {
      icon: 'info',
      buttons: [{ text: 'Aceptar', role: 'confirm' }],
      backdropDismiss: true
    };

    const modalOptions = { ...defaultOptions, ...options };

    const modal = await this.modalCtrl.create({
      component: AlertaPersonalizadaComponent,
      componentProps: {
        title: modalOptions.title,
        message: modalOptions.message,
        icon: modalOptions.icon,
        buttons: modalOptions.buttons,
      },
      backdropDismiss: modalOptions.backdropDismiss,
      cssClass: modalOptions.cssClass || 'alert-modal'
    });

    await modal.present();
    await modal.onDidDismiss();
  }

  /**
   * Muestra una alerta de éxito
   */
  async showSuccess(message: string, title: string = 'Éxito'): Promise<void> {
    await this.showAlert({
      title,
      message,
      icon: 'success',
      buttons: [{ text: 'Aceptar', role: 'confirm' }]
    });
  }

  /**
   * Muestra una alerta de error
   */
  async showError(message: string, title: string = 'Error'): Promise<void> {
    await this.showAlert({
      title,
      message,
      icon: 'error',
      buttons: [{ text: 'Aceptar', role: 'confirm' }]
    });
  }

  /**
   * Muestra una alerta de advertencia
   */
  async showWarning(message: string, title: string = 'Advertencia'): Promise<void> {
    await this.showAlert({
      title,
      message,
      icon: 'warning',
      buttons: [{ text: 'Aceptar', role: 'confirm' }]
    });
  }

  /**
   * Muestra un diálogo de confirmación y devuelve true si el usuario confirma
   * o false si cancela.
   */
  async confirm(options: ConfirmOptions): Promise<boolean> {
    const defaultOptions: Partial<ConfirmOptions> = {
      icon: 'warning',
      confirmText: 'Aceptar',
      cancelText: 'Cancelar',
      backdropDismiss: true,
      isDestructive: false
    };

    const mergedOptions = { ...defaultOptions, ...options };
    
    // Crear botones con estilos apropiados
    const buttons: AlertButton[] = [
      { 
        text: mergedOptions.cancelText!, 
        role: 'cancel'
      },
      { 
        text: mergedOptions.confirmText!, 
        role: 'confirm',
        cssClass: mergedOptions.isDestructive ? 'button-danger' : 'confirm-button'
      }
    ];

    const modal = await this.modalCtrl.create({
      component: AlertaPersonalizadaComponent,
      componentProps: {
        title: mergedOptions.title,
        message: mergedOptions.message,
        icon: mergedOptions.icon,
        buttons: buttons
      },
      backdropDismiss: mergedOptions.backdropDismiss,
      cssClass: mergedOptions.cssClass || 'alert-modal'
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();
    
    return data === 'confirm';
  }

  /**
   * Confirmación específica para crear un nuevo elemento
   */
  async confirmCreate(entityName: string = 'elemento'): Promise<boolean> {
    return this.confirm({
      title: 'Confirmar Creación',
      message: `¿Está seguro que desea crear este ${entityName}?`,
      confirmText: 'Crear',
      icon: 'info'
    });
  }

  /**
   * Confirmación específica para editar un elemento existente
   */
  async confirmEdit(entityName: string = 'elemento'): Promise<boolean> {
    return this.confirm({
      title: 'Confirmar Edición',
      message: `¿Está seguro que desea actualizar este ${entityName}?`,
      confirmText: 'Actualizar',
      icon: 'info'
    });
  }

  /**
   * Confirmación específica para eliminar un elemento
   */
  async confirmDelete(entityName: string = 'elemento', details?: string): Promise<boolean> {
    const message = details 
      ? `¿Está seguro que desea eliminar ${entityName} "${details}"?` 
      : `¿Está seguro que desea eliminar este ${entityName}?`;
      
    return this.confirm({
      title: 'Confirmar Eliminación',
      message,
      confirmText: 'Eliminar',
      isDestructive: true,
      icon: 'warning'
    });
  }

  /**
   * Confirmación para descartar cambios no guardados
   */
  async confirmDiscard(): Promise<boolean> {
    return this.confirm({
      title: 'Descartar Cambios',
      message: '¿Está seguro que desea descartar los cambios no guardados?',
      confirmText: 'Descartar',
      icon: 'warning'
    });
  }

  /**
   * Muestra una alerta usando el AlertController nativo de Ionic
   * Útil cuando se requiere una alerta más simple/nativa
   */
  async showNativeAlert(
    header: string, 
    message: string, 
    buttons: (string | { text: string; role?: string; handler?: () => void })[] = ['Aceptar']
  ): Promise<void> {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons,
      backdropDismiss: false
    });

    await alert.present();
  }
}
