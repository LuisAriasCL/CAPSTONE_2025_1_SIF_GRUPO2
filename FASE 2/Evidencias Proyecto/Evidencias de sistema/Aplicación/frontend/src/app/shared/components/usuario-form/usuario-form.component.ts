import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { LoadingController, ToastController } from '@ionic/angular/standalone';
import { Observable } from 'rxjs';

import { CrudBaseComponent } from 'src/app/core';
import { UserService } from 'src/app/core';
import { ModalHeaderComponent } from '../modal-components/modal-header/modal-header.component';
import { ModalFooterComponent } from '../modal-components/modal-footer/modal-footer.component';

@Component({
  selector: 'app-usuario-form',
  templateUrl: './usuario-form.component.html',
  styleUrls: ['./usuario-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    IonicModule, 
    ReactiveFormsModule,
    ModalHeaderComponent,
    ModalFooterComponent
  ] 
})
export class UsuarioFormComponent extends CrudBaseComponent {
  private userService = inject(UserService);
  
  // Additional properties required by template
  constants = {
    ROLES: [
      { value: 'Admin', label: 'Administrador' },
      { value: 'Tecnico', label: 'Técnico' },
      { value: 'Conductor', label: 'Conductor' }
    ]
  };

  constructor(
    loadingCtrl: LoadingController,
    toastCtrl: ToastController
  ) {
    super(loadingCtrl, toastCtrl);
  }

  get title(): string {
    return 'Usuario';
  }
  
  createForm(): FormGroup {
    const item = (this.item || {}) as any;
    return this.formManager.createUserForm(item);
  }

  saveItem(data: any): Observable<any> {
    return this.userService.createUser(data);
  }

  updateItem(id: any, data: any): Observable<any> {
    return this.userService.updateUser(id, data);
  }

  override getItem(id: any): Observable<any> {
    return this.userService.getUserById(id);
  }

  // Methods required by template
  confirm(): void {
    this.onSubmit();
  }

  getFieldErrorMessage(fieldName: string): string {
    const control = this.form?.get(fieldName);
    if (control && control.invalid && control.touched) {
      if (control.errors?.['required']) {
        return `${fieldName} es requerido`;
      }
      if (control.errors?.['email']) {
        return 'Email inválido';
      }
      if (control.errors?.['minlength']) {
        return `Mínimo ${control.errors?.['minlength'].requiredLength} caracteres`;
      }
    }
    return '';
  }
}
