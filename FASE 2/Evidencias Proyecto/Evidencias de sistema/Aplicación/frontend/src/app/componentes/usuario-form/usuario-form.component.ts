import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Usuario } from 'src/app/services/api.service';
import { AlertaPersonalizadaComponent } from '../alerta-personalizada/alerta-personalizada.component';

@Component({
  selector: 'app-usuario-form',
  templateUrl: './usuario-form.component.html',
  styleUrls: ['./usuario-form.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
})
export class UsuarioFormComponent implements OnInit {
  @Input() usuario: Usuario | null = null;
  @Input() isViewMode: boolean = false;

  form!: FormGroup;
  isEditMode = false;
  isSubmitted = false;
  roles = ['admin', 'gestor', 'conductor', 'mantenimiento', 'tecnico'];
  private fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);

  ngOnInit() {
    this.isEditMode = !!this.usuario;

    this.form = this.fb.group({
      pri_nom_usu: [this.usuario?.pri_nom_usu || '', Validators.required],
      pri_ape_usu: [this.usuario?.pri_ape_usu || '', Validators.required],
      rut_usu: [this.usuario?.rut_usu || '', Validators.required],
      email: [
        this.usuario?.email || '',
        [Validators.required, Validators.email],
      ],
      rol: [this.usuario?.rol || null, Validators.required],

      clave: ['', this.isEditMode ? null : Validators.required],
    });
  }
  async cancel() {
    // Verificar si hay cambios sin guardar
    if (this.form.dirty) {
      const modal = await this.modalCtrl.create({
        component: AlertaPersonalizadaComponent,
        componentProps: {
          title: 'Confirmar Cancelación',
          message:
            'Tienes cambios sin guardar. ¿Estás seguro de que deseas cancelar?',
          icon: 'warning',
          buttons: [
            {
              text: 'Continuar Editando',
              role: 'cancel',
              cssClass: 'button-secondary',
            },
            {
              text: 'Descartar Cambios',
              role: 'confirm',
              cssClass: 'button-danger',
            },
          ],
        },
        backdropDismiss: false,
        cssClass: 'custom-alert-modal',
      });

      await modal.present();
      const { data } = await modal.onDidDismiss();

      if (data === 'confirm') {
        this.closeModal();
      }
    } else {
      this.closeModal();
    }
  }

  async closeModal() {
    await this.modalCtrl.dismiss();
  } // Getter para facilitar acceso a los controles del formulario
  get f() {
    return this.form.controls;
  }
  async confirm() {
    this.isSubmitted = true;
    if (this.form.valid) {
      const formData = this.form.value;
      const action = this.isEditMode ? 'actualizar' : 'crear';
      const actionText = this.isEditMode ? 'Actualizar' : 'Crear';

      const modal = await this.modalCtrl.create({
        component: AlertaPersonalizadaComponent,
        componentProps: {
          title: `Confirmar ${actionText}`,
          message: this.isEditMode
            ? `¿Estás seguro de que deseas actualizar la información de <strong>${formData.pri_nom_usu} ${formData.pri_ape_usu}</strong>?`
            : `¿Estás seguro de que deseas crear el usuario <strong>${formData.pri_nom_usu} ${formData.pri_ape_usu}</strong> con rol de <strong>${formData.rol}</strong>?`,
          icon: this.isEditMode ? 'warning' : 'success',
          buttons: [
            { text: 'Cancelar', role: 'cancel', cssClass: 'button-secondary' },
            {
              text: actionText,
              role: 'confirm',
              cssClass: this.isEditMode ? 'button-warning' : 'button-success',
            },
          ],
        },
        backdropDismiss: false,
        cssClass: 'custom-alert-modal',
      });

      await modal.present();
      const { data } = await modal.onDidDismiss();

      if (data === 'confirm') {
        this.modalCtrl.dismiss(formData, 'confirm');
      }
    }
  }
}
