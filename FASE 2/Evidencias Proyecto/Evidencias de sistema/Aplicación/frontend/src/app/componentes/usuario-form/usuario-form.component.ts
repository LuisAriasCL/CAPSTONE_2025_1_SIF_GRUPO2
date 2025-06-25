// FASE 2/Evidencias Proyecto/Evidencias de sistema/Aplicación/frontend/src/app/componentes/usuario-form/usuario-form.component.ts

import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidatorFn,
  AsyncValidatorFn, 
} from '@angular/forms';
import { Usuario, ApiService } from 'src/app/services/api.service'; 
import { AlertaPersonalizadaComponent } from '../alerta-personalizada/alerta-personalizada.component';
import { debounceTime, switchMap, map, first, catchError, distinctUntilChanged, filter } from 'rxjs/operators'; 
import { of } from 'rxjs'; 


// Función para validar el formato del RUT chileno (con o sin puntos, con guion, con K)
function rutValidator(control: AbstractControl): { [key: string]: boolean } | null {
  const rut = control.value;
  if (!rut) {
    return null; 
  }

  let cleanRut = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
  let rutBody = cleanRut.slice(0, -1); 
  const dv = cleanRut.slice(-1);

  if (!/^\d+$/.test(rutBody) || rutBody.length < 7) {
    return { invalidRutFormat: true };
  }

  let M = 0;
  let S = 1;
  let tempRutBodyNum = parseInt(rutBody, 10); 

  while (tempRutBodyNum > 0) {
    S = S + 1;
    if (S === 8) S = 2; 
    M += (tempRutBodyNum % 10) * S;
    tempRutBodyNum = Math.floor(tempRutBodyNum / 10);
  }
  
  const calculatedDv = (M - (Math.floor(M / 11) * 11));
  const finalDv = calculatedDv === 0 ? '0' : (calculatedDv === 1 ? 'K' : (11 - calculatedDv).toString());

  if (finalDv === dv) {
    return null; 
  } else {
    return { invalidRut: true }; 
  }
}

// Validador para nombres y apellidos (solo letras y espacios, incluyendo tildes y Ñ)
function nameValidator(control: AbstractControl): { [key: string]: boolean } | null {
  const name = control.value;
  if (!name) {
    return null;
  }
  return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name) ? null : { invalidName: true };
}

// Validador para número de celular (ej. 9 dígitos numéricos, puede empezar con +569 o 9)
function cellphoneValidator(control: AbstractControl): { [key: string]: boolean } | null {
  const cellphone = control.value;
  if (!cellphone) {
    return null;
  }
  return /^((\+?56)?9\d{8})$/.test(cellphone.replace(/\s/g, '')) ? null : { invalidCellphone: true };
}

// Validador a nivel de formulario para fechas de licencia
function licenseDatesValidator(form: FormGroup): { [key: string]: boolean } | null {
  const fecEmi = form.get('fec_emi_lic')?.value;
  const fecVen = form.get('fec_ven_lic')?.value;

  if (fecEmi && fecVen) {
    const emissionDate = new Date(fecEmi);
    const expirationDate = new Date(fecVen);
    const today = new Date();
    today.setHours(0,0,0,0); 

    if (emissionDate > expirationDate) {
      return { emissionAfterExpiration: true };
    }
    if (emissionDate > today) {
        return { futureEmissionDate: true };
    }
  }
  return null;
}

// Validador para comparar contraseñas a nivel de grupo
const passwordMatchValidator: ValidatorFn = (control: AbstractControl): { [key: string]: boolean } | null => {
  const password = control.get('clave');
  const confirmPassword = control.get('confirmClave');

  if (!password || !confirmPassword) { 
    return null;
  }

  if (confirmPassword.value && password.value !== confirmPassword.value) {
    if (!confirmPassword.errors || !confirmPassword.errors['passwordMismatch']) {
      confirmPassword.setErrors({ passwordMismatch: true });
    }
    return { passwordMismatch: true }; 
  } else {
    if (confirmPassword.errors && confirmPassword.errors['passwordMismatch']) {
      confirmPassword.setErrors(null); 
    }
    return null;
  }
};


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
  // @Input() isEditMode ya no se necesita como @Input() si se deriva de 'usuario'
  isEditMode = false; // Se moverá a ser una propiedad de la clase, derivada en ngOnInit

  form!: FormGroup;
  isSubmitted = false;
  roles = ['admin', 'gestor', 'conductor', 'mantenimiento', 'tecnico'];
  private fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);
  private apiService = inject(ApiService); 


  // Validador asíncrono para verificar unicidad de RUT
  rutExistenceValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      const rut = control.value as string; 
      const currentUserId = this.usuario?.id_usu; 
      
      if (!rut || control.errors?.['invalidRut'] || control.errors?.['invalidRutFormat']) {
        return of(null);
      }

      // CLAVE PARA EDICIÓN: Si está en modo edición y el RUT no ha cambiado, no re-chequear la existencia
      if (this.isEditMode && this.usuario && rut === this.usuario.rut_usu) {
        return of(null);
      }

      return control.valueChanges.pipe(
        debounceTime(500), 
        distinctUntilChanged(), 
        switchMap(value => {
          if (!value) { 
            return of(null);
          }
          return this.apiService.checkRutExists(value as string, currentUserId).pipe(
            map(response => {
              if (response.exists) {
                return { rutExists: true }; 
              } else {
                return null; 
              }
            }),
            catchError((err) => {
                console.error('Error en la llamada a checkRutExists:', err);
                return of(null); 
            })
          );
        }),
        first() 
      );
    };
  }

  // Validador asíncrono para verificar unicidad de Email
  emailExistenceValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      const email = control.value as string;
      const currentUserId = this.usuario?.id_usu;

      if (!email || control.errors?.['email']) {
        return of(null);
      }

      // CLAVE PARA EDICIÓN: Si está en modo edición y el email no ha cambiado, no re-chequear la existencia
      if (this.isEditMode && this.usuario && email === this.usuario.email) {
        return of(null);
      }

      return control.valueChanges.pipe(
        debounceTime(500), 
        distinctUntilChanged(), 
        switchMap(value => {
          if (!value) {
            return of(null);
          }
          return this.apiService.checkEmailExists(value as string, currentUserId).pipe(
            map(response => {
              if (response.exists) {
                return { emailExists: true }; 
              } else {
                return null; 
              }
            }),
            catchError((err) => {
                console.error('Error en la llamada a checkEmailExists:', err);
                return of(null); 
            })
          );
        }),
        first() 
      );
    };
  }


  ngOnInit() {
    this.isEditMode = !!this.usuario; // SE DEFINE AQUÍ si es modo edición

    this.form = this.fb.group({
      pri_nom_usu: [this.usuario?.pri_nom_usu || '', [Validators.required, nameValidator]],
      seg_nom_usu: [this.usuario?.seg_nom_usu || '', nameValidator],
      pri_ape_usu: [this.usuario?.pri_ape_usu || '', [Validators.required, nameValidator]],
      seg_ape_usu: [this.usuario?.seg_ape_usu || '', nameValidator],
      rut_usu: [this.usuario?.rut_usu || '', {
        validators: [Validators.required, rutValidator],
        asyncValidators: [this.rutExistenceValidator()], 
        updateOn: 'blur' 
      }],
      email: [
        this.usuario?.email || '',
        {
          validators: [Validators.required, Validators.email],
          asyncValidators: [this.emailExistenceValidator()], 
          updateOn: 'blur' 
        }
      ],
      celular: [this.usuario?.celular || '', cellphoneValidator],
      rol: [this.usuario?.rol || null, Validators.required],
      // CLAVE Y CONFIRMCLAVE: Condicionalmente requeridos y con validadores solo si NO es isEditMode
      clave: ['', this.isEditMode ? [] : [Validators.required, Validators.minLength(6)]], 
      confirmClave: ['', this.isEditMode ? [] : Validators.required], 
      
      fec_emi_lic: [this.usuario?.fec_emi_lic || null],
      fec_ven_lic: [this.usuario?.fec_ven_lic || null],
      tipo_lic: [this.usuario?.tipo_lic || null],
      archivo_url_lic: [this.usuario?.archivo_url_lic || null] 
    }, { 
        validators: [
            licenseDatesValidator, 
            this.isEditMode ? [] : passwordMatchValidator 
        ]
    }); 

    // Si está en modo vista, deshabilitar todos los controles
    if (this.isViewMode) {
      this.form.disable();
    }

    this.form.get('rol')?.valueChanges.subscribe(rol => {
      this.applyConditionalValidators(rol);
    });

    // IMPORTANTE: Asegurarse de que el usuario ya se haya cargado antes de aplicar validadores condicionales
    // Esto es especialmente relevante para los campos de licencia.
    if (this.usuario) {
      this.applyConditionalValidators(this.form.get('rol')?.value);
      // Formatear fechas si vienen del backend como strings de fecha
      if (this.usuario.fec_emi_lic) {
        this.f['fec_emi_lic'].setValue(this.usuario.fec_emi_lic.split('T')[0]);
      }
      if (this.usuario.fec_ven_lic) {
        this.f['fec_ven_lic'].setValue(this.usuario.fec_ven_lic.split('T')[0]);
      }
    }


    if (!this.isEditMode) {
      this.form.get('clave')?.valueChanges.subscribe(() => {
        this.form.get('confirmClave')?.updateValueAndValidity(); 
        this.form.updateValueAndValidity(); 
      });
      this.form.get('confirmClave')?.valueChanges.subscribe(() => {
        this.form.updateValueAndValidity(); 
      });
    }
  }

  private applyConditionalValidators(rol: string) {
    const fecEmiLicControl = this.form.get('fec_emi_lic');
    const fecVenLicControl = this.form.get('fec_ven_lic');
    const tipoLicControl = this.form.get('tipo_lic');
    const archivoUrlLicControl = this.form.get('archivo_url_lic');

    if (rol === 'conductor') {
      fecEmiLicControl?.setValidators(Validators.required);
      fecVenLicControl?.setValidators(Validators.required);
      tipoLicControl?.setValidators(Validators.required);
    } else {
      fecEmiLicControl?.clearValidators();
      fecVenLicControl?.clearValidators();
      tipoLicControl?.clearValidators();
      archivoUrlLicControl?.clearValidators(); 

      fecEmiLicControl?.patchValue(null);
      fecVenLicControl?.patchValue(null);
      tipoLicControl?.patchValue(null);
      archivoUrlLicControl?.patchValue(null);
    }
    fecEmiLicControl?.updateValueAndValidity();
    fecVenLicControl?.updateValueAndValidity();
    tipoLicControl?.updateValueAndValidity();
    archivoUrlLicControl?.updateValueAndValidity();
    this.form.updateValueAndValidity(); 
  }


  async cancel() {
    if (this.form.dirty) {
      const modal = await this.modalCtrl.create({
        component: AlertaPersonalizadaComponent,
        componentProps: {
          title: 'Confirmar Cancelación',
          message: 'Tienes cambios sin guardar. ¿Estás seguro de que deseas cancelar?',
          icon: 'warning',
          buttons: [
            { text: 'Continuar Editando', role: 'cancel', cssClass: 'button-secondary' },
            { text: 'Descartar Cambios', role: 'confirm', cssClass: 'button-danger' },
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
  }

  get f() {
    return this.form.controls;
  }

  async confirm() {
    this.isSubmitted = true;
    this.form.markAllAsTouched(); 

    // IMPORTE: Esperar a que las validaciones asíncronas se completen
    if (this.f['rut_usu'].pending) {
        await this.f['rut_usu'].statusChanges.pipe(
            filter(status => status !== 'PENDING'), 
            first()
        ).toPromise();
    }
    if (this.f['email'].pending) { 
        await this.f['email'].statusChanges.pipe(
            filter(status => status !== 'PENDING'), 
            first()
        ).toPromise();
    }
    
    if (!this.form.valid) {
      const errorMessage = this.getFormValidationErrors();
      console.log("Errores de validación:", errorMessage); 

      let alertMessage = 'Por favor, revisa los campos con errores antes de continuar.';
      let alertTitle = 'Formulario Inválido';

      if (this.form.errors?.['passwordMismatch']) {
        alertMessage = 'Las contraseñas no coinciden. Por favor, verifica.';
      } else if (this.form.errors?.['emissionAfterExpiration']) {
        alertMessage = 'La fecha de vencimiento de la licencia debe ser posterior a la de emisión.';
      } else if (this.form.errors?.['futureEmissionDate']) {
        alertMessage = 'La fecha de emisión de la licencia no puede ser futura.';
      } else if (this.f['rut_usu'].errors?.['rutExists']) { 
        alertMessage = `El RUT "${this.f['rut_usu'].value}" ya está registrado. Por favor, utiliza otro RUT o edita el usuario existente.`;
        alertTitle = 'RUT Existente'; 
      } else if (this.f['email'].errors?.['emailExists']) { 
        alertMessage = `El email "${this.f['email'].value}" ya está registrado por otro usuario.`;
        alertTitle = 'Email Existente';
      }


      await this.modalCtrl.create({
        component: AlertaPersonalizadaComponent,
        componentProps: {
          title: alertTitle, 
          message: alertMessage,
          icon: 'error',
          buttons: [{ text: 'Aceptar', role: 'confirm' }],
        },
        backdropDismiss: false,
        cssClass: 'custom-alert-modal',
      }).then(modal => modal.present());
      return;
    }

    const formData = this.form.getRawValue(); 
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
      const dataToSubmit = { ...formData };
      delete dataToSubmit.confirmClave; 
      this.modalCtrl.dismiss(dataToSubmit, 'confirm'); 
    }
  }

  private getFormValidationErrors() {
    const errors: any = {};
    Object.keys(this.form.controls).forEach(key => {
      const controlErrors = this.form.get(key)?.errors;
      if (controlErrors) {
        errors[key] = controlErrors;
      }
    });
    const formErrors = this.form.errors;
    if (formErrors) {
      errors['formErrors'] = formErrors;
    }
    return errors;
  }
}