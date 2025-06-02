import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { IonicModule, ToastController, LoadingController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { idCardOutline, callOutline, mailOutline, lockClosedOutline } from 'ionicons/icons'; // Íconos para RUT, Celular, Email y Contraseña

import { AuthService } from '../../services/auth.service';

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
    ReactiveFormsModule, // <-- Necesario para [formGroup], formControlName, etc.
  ],
})
export class RegisterPage implements OnInit {
  registerForm!: FormGroup; // El ! indica que se inicializará en ngOnInit
  isSubmitted = false; // Flag para mostrar errores solo después del primer intento de envío
  availableRoles: string[] = ['gestor', 'mantenimiento', 'conductor'];

  constructor(
    private formBuilder: FormBuilder, // Ayuda a crear formularios
    private authService: AuthService, // Nuestro servicio de autenticación
    private router: Router, // Para navegar
    private toastController: ToastController, // Para mensajes de éxito/info
    private loadingController: LoadingController, // Para indicador de "cargando"
    private alertController: AlertController // Para mostrar errores
  ) {
    // Registrar íconos personalizados
    addIcons({
      idCardOutline, // Ícono para RUT
      callOutline, // Ícono para Celular
      mailOutline, // Ícono para Email
      lockClosedOutline, // Ícono para Contraseña y Confirmar Contraseña
    });
  }

  ngOnInit() {
    this.registerForm = this.formBuilder.group(
      {
        pri_nom_usu: ['', [Validators.required]],
        seg_nom_usu: [''],
        pri_ape_usu: ['', [Validators.required]],
        seg_ape_usu: [''],
        email: ['', [Validators.required, Validators.email]],
        rut_usu: [''], // Añadir validadores si es necesario
        celular: [''],
        clave: ['', [Validators.required, Validators.minLength(6)]],
        confirmarClave: ['', [Validators.required]], // Para la validación de coincidencia
        rol: ['conductor', [Validators.required]], // Valor por defecto y requerido
      },
      {
        // Validador para confirmarClave debe comparar con 'clave'
        validators: passwordMatchValidator('clave', 'confirmarClave'), // <-- Pasamos los nombres de los controles
      }
    );
  }

  // --- Getters para acceso fácil a los controles en el HTML (opcional) ---
  get email() {
    return this.registerForm.get('email');
  }
  get clave() {
    return this.registerForm.get('clave');
  }
  get confirmarClave() {
    return this.registerForm.get('confirmarClave');
  }
  // --- Fin Getters ---

  // --- Método llamado al enviar el formulario ---
  async register() {
    this.isSubmitted = true;
    if (this.registerForm.invalid) {
      console.log('Formulario inválido:', this.registerForm.value);
      return;
    }

    const loading = await this.loadingController.create({ message: 'Registrando...' });
    await loading.present();

    const { pri_nom_usu, seg_nom_usu, pri_ape_usu, seg_ape_usu, email, rut_usu, celular, clave, rol } =
      this.registerForm.value;

    this.authService.register({ pri_nom_usu, seg_nom_usu, pri_ape_usu, seg_ape_usu, email, rut_usu, celular, clave, rol }).subscribe({
      next: async (res) => {
        await loading.dismiss();
        console.log('Usuario registrado:', res);
        const toast = await this.toastController.create({ /* ... */ });
        await toast.present();
        this.router.navigateByUrl('/login', { replaceUrl: true });
      },
      error: async (error) => {
        await loading.dismiss();
        console.error('Error en el registro:', error);
        const alert = await this.alertController.create({ /* ... */ });
        await alert.present();
      },
    });
  }
}