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

@Component({
  selector: 'app-usuario-form',
  templateUrl: './usuario-form.component.html',
  styleUrls: ['./usuario-form.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
})
export class UsuarioFormComponent implements OnInit {
  @Input() usuario: Usuario | null = null;
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

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  } // Getter para facilitar acceso a los controles del formulario
  get f() {
    return this.form.controls;
  }

  confirm() {
    this.isSubmitted = true;
    if (this.form.valid) {
      this.modalCtrl.dismiss(this.form.value, 'confirm');
    }
  }
}
