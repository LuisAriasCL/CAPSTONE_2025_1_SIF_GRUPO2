import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { IonicModule, ToastController, LoadingController, AlertController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import { idCardOutline, callOutline, mailOutline, lockClosedOutline, personOutline, settingsOutline, chevronBackOutline } from 'ionicons/icons';

import { AuthService } from '../../core/services/auth.service';
import { BaseFormComponent } from '../../core/base/base-form.component';
import { UserService } from '../../core/services/user.service';
import { USER_CONSTANTS } from '../../core/constants/user.constants';
import { FormUtils } from '../../core/utils/form.utils';

// Validador para asegurar que las contraseñas coincidan
export function passwordMatchValidator(controlName: string, matchingControlName: string) {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const fg = formGroup as FormGroup;
    const control = fg.get(controlName);
    const matchingControl = fg.get(matchingControlName);

    if (!control || !matchingControl) {
      return null;
    }

    if (matchingControl.errors && !matchingControl.errors['passwordMismatch']) {
      return null;
    }

    if (control.value !== matchingControl.value) {
      matchingControl.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      if (matchingControl.errors?.['passwordMismatch']) {
        delete matchingControl.errors['passwordMismatch'];
        if (Object.keys(matchingControl.errors).length === 0) {
          matchingControl.setErrors(null);
        }
      }
      return null;
    }
  };
}

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ],
})
export class RegisterPage extends BaseFormComponent implements OnInit {
  form!: FormGroup; // Required by BaseFormComponent
  public registerForm!: FormGroup; // Mantenemos esta para compatibilidad
  isSubmitted = false;
  
  // Usar constantes centralizadas
  readonly constants = USER_CONSTANTS;
  availableRoles = this.constants.ROLES.filter(role => ['gestor', 'tecnico', 'conductor'].includes(role.value));

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private alertController: AlertController,
    loadingController: LoadingController,
    toastController: ToastController
  ) {
    super(loadingController, toastController);
    this.initializeIcons();
  }

  private initializeIcons(): void {
    addIcons({
      idCardOutline,
      callOutline,
      mailOutline,
      lockClosedOutline,
      personOutline,
      settingsOutline,
      chevronBackOutline
    });
  }
  ngOnInit() {
    this.initForm();
  }

  private initForm(): void {
    this.registerForm = this.formBuilder.group(
      {
        pri_nom_usu: [
          '', 
          [
            Validators.required,
            Validators.minLength(this.constants.FORM_CONFIG.MIN_NAME_LENGTH),
            Validators.maxLength(this.constants.FORM_CONFIG.MAX_NAME_LENGTH)
          ]
        ],
        seg_nom_usu: [''],
        pri_ape_usu: [
          '', 
          [
            Validators.required,
            Validators.minLength(this.constants.FORM_CONFIG.MIN_NAME_LENGTH),
            Validators.maxLength(this.constants.FORM_CONFIG.MAX_NAME_LENGTH)
          ]
        ],
        seg_ape_usu: [''],
        email: ['', [Validators.required, Validators.email]],
        rut_usu: [''],
        celular: [''],
        clave: [
          '', 
          [
            Validators.required, 
            Validators.minLength(this.constants.FORM_CONFIG.MIN_PASSWORD_LENGTH)
          ]
        ],
        confirmarClave: ['', [Validators.required]],
        rol: ['conductor', [Validators.required]],
      },
      {
        validators: passwordMatchValidator('clave', 'confirmarClave'),
      }
    );
    
    // Assign to form for BaseFormComponent compatibility
    this.form = this.registerForm;
  }

  // Usar utilidad centralizada
  override compareWith = FormUtils.compareWith;
  async register() {
    this.isSubmitted = true;
    if (this.registerForm.invalid) {
      FormUtils.markFormGroupTouched(this.registerForm);
      await this.showToast('Por favor, completa todos los campos requeridos correctamente.', 'danger');
      return;
    }

    const loading = await this.showLoading('Registrando...');

    this.authService.register(this.registerForm.value).subscribe({
      next: async (res) => {
        await loading.dismiss();
        await this.showToast('¡Usuario registrado con éxito!', 'success');
        this.router.navigateByUrl('/login', { replaceUrl: true });
      },
      error: async (error) => {
        await loading.dismiss();
        const errorMessage = error.error?.message || 'Ocurrió un error desconocido.';
        this.presentAlert('Error en el Registro', errorMessage);
      },
    });
  }

  /**
   * Obtiene el mensaje de error para un campo específico
   */
  getFieldErrorMessage(fieldName: string): string {
    return FormUtils.getFieldErrorMessage(
      this.registerForm, 
      fieldName, 
      this.constants.VALIDATION_MESSAGES[fieldName as keyof typeof this.constants.VALIDATION_MESSAGES]
    ) || '';
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}