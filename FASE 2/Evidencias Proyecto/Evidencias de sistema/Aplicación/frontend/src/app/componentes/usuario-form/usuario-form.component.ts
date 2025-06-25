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
import { debounceTime, switchMap, map, first, catchError, distinctUntilChanged, filter } from 'rxjs/operators'; // AÑADIDO: filter
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

  form!: FormGroup;
  isEditMode = false;
  isSubmitted = false;
  roles = ['admin', 'gestor', 'conductor', 'mantenimiento', 'tecnico'];
  private fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);
  private apiService = inject(ApiService); 


  // Validador asíncrono para verificar unicidad de RUT
  rutExistenceValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      const rut = control.value as string; // Asegura que 'rut' es un string
      const currentUserId = this.usuario?.id_usu; // Obtener el ID del usuario actual si está en modo edición

      // LOG: RUT en validador asíncrono
      console.log('Async RUT Validator: Validando RUT:', rut);
      
      // No validar si el RUT está vacío o si ya falló la validación síncrona (ej. formato inválido)
      if (!rut || control.errors?.['invalidRut'] || control.errors?.['invalidRutFormat']) {
        console.log('Async RUT Validator: RUT vacío o formato/DV inválido, saltando verificación de existencia.');
        return of(null);
      }

      // Si en modo edición y el RUT no ha cambiado, no es necesario re-chequear la existencia
      if (this.isEditMode && this.usuario && rut === this.usuario.rut_usu) {
        console.log('Async RUT Validator: Modo edición y RUT sin cambios, saltando verificación de existencia.');
        return of(null);
      }

      // IMPORTANTE: Asegúrate de que el pipe de `valueChanges` solo se ejecute para la validación asíncrona
      // y no cause un ciclo infinito de re-validación al actualizar el estado del control.
      // El 'updateOn: blur' en la definición del control ya ayuda a limitar esto.
      return control.valueChanges.pipe(
        debounceTime(500), 
        distinctUntilChanged(), 
        switchMap(value => {
          if (!value) { 
            console.log('Async RUT Validator: Valor después de debounce es nulo, validación pasa.');
            return of(null);
          }
          console.log('Async RUT Validator: Llamando a checkRutExists para RUT:', value);
          return this.apiService.checkRutExists(value as string, currentUserId).pipe(
            map(response => {
              console.log('Async RUT Validator: Respuesta de API checkRutExists:', response);
              if (response.exists) {
                console.log('Async RUT Validator: RUT EXISTE, devolviendo error rutExists.');
                return { rutExists: true }; 
              } else {
                console.log('Async RUT Validator: RUT NO EXISTE, devolviendo null.');
                return null; 
              }
            }),
            // Manejo de errores de la API: si la API falla (ej. 500), no marcamos el RUT como existente,
            // sino como "no verificado" o simplemente no bloqueamos la UI con un error de unicidad.
            catchError((err) => {
                console.error('Async RUT Validator: Error en la llamada a checkRutExists:', err);
                return of(null); // No queremos bloquear el formulario por un error de servidor aquí.
            })
          );
        }),
        first() 
      );
    };
  }


  ngOnInit() {
    this.isEditMode = !!this.usuario;

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
        [Validators.required, Validators.email],
      ],
      celular: [this.usuario?.celular || '', cellphoneValidator],
      rol: [this.usuario?.rol || null, Validators.required],
      clave: ['', this.isEditMode ? [] : [Validators.required, Validators.minLength(6)]], 
      confirmClave: ['', this.isEditMode ? [] : Validators.required], // Campo para confirmar contraseña
      
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

    if (this.isViewMode) {
      this.form.disable();
    }

    this.form.get('rol')?.valueChanges.subscribe(rol => {
      this.applyConditionalValidators(rol);
    });

    this.applyConditionalValidators(this.form.get('rol')?.value);

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

    // IMPORTE: Esperar a que la validación asíncrona del RUT se complete
    // Usamos `statusChanges` y `filter(status => status !== 'PENDING')` para esperar que el estado ya no sea PENDING
    if (this.f['rut_usu'].pending) {
        console.log('Confirm: Validando RUT asíncronamente, esperando...');
        // Espera hasta que el validador asíncrono del RUT termine
        await this.f['rut_usu'].statusChanges.pipe(
            filter(status => status !== 'PENDING'), // Espera que no sea 'PENDING'
            first() // Toma la primera emisión y completa
        ).toPromise();
        console.log('Confirm: Validación asíncrona del RUT completada.');
    }
    
    if (!this.form.valid) {
      const errorMessage = this.getFormValidationErrors();
      console.log("Validation Errors:", errorMessage); 

      let alertMessage = 'Por favor, revisa los campos con errores antes de continuar.';
      let alertTitle = 'Formulario Inválido';

      if (this.form.errors?.['passwordMismatch']) {
        alertMessage = 'Las contraseñas no coinciden. Por favor, verifica.';
      } else if (this.form.errors?.['emissionAfterExpiration']) {
        alertMessage = 'La fecha de vencimiento de la licencia debe ser posterior a la de emisión.';
      } else if (this.form.errors?.['futureEmissionDate']) {
        alertMessage = 'La fecha de emisión de la licencia no puede ser futura.';
      } else if (this.f['rut_usu'].errors?.['rutExists']) { 
        alertMessage = `El RUT "${this.f['rut_usu'].value}" ya está registrado. Si deseas editarlo, búscalo en el listado de usuarios.`;
        alertTitle = 'RUT Existente'; 
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