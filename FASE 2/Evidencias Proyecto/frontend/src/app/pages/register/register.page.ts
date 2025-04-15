import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { IonicModule, ToastController, LoadingController, AlertController, NavController } from '@ionic/angular';
import { Router } from '@angular/router'; 


import { AuthService } from '../../services/auth.service';

// --- Validador Custom para Password Match ---

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

 
  if (!password || !confirmPassword) {
    return null;
  }

  return password === confirmPassword ? null : { passwordMismatch: true };
}
// --- Fin Validador ---


@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    ReactiveFormsModule // <-- Necesario para [formGroup], formControlName, etc.
  ]
})
export class RegisterPage implements OnInit {

  registerForm!: FormGroup; // El ! indica que se inicializará en ngOnInit
  isSubmitted = false; // Flag para mostrar errores solo después del primer intento de envío
  availableRoles: string[] = ['gestor', 'mantenimiento', 'conductor'];
  constructor(
    private formBuilder: FormBuilder, // Ayuda a crear formularios
    private authService: AuthService,   // Nuestro servicio de autenticación
    private router: Router,             // Para navegar
    private toastController: ToastController, // Para mensajes de éxito/info
    private loadingController: LoadingController, // Para indicador de "cargando"
    private alertController: AlertController    // Para mostrar errores
  ) { }

  ngOnInit() {
    // Inicializar el formulario reactivo
    this.registerForm = this.formBuilder.group({
      name: ['', [Validators.required]], 
      email: ['', [Validators.required, Validators.email]], 
      password: ['', [Validators.required, Validators.minLength(6)]], // Campo 'password', requerido y mínimo 6 caracteres
      confirmPassword: ['', [Validators.required]],
      role: ['', [Validators.required]] // Campo 'confirmPassword', requerido
    }, {
      validators: passwordMatchValidator // Añadir validador a nivel de grupo para verificar passwords
    });
  }

  // --- Getters para acceso fácil a los controles en el HTML (opcional) ---
  get name() { return this.registerForm.get('name'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
  get role() { return this.registerForm.get('role'); }
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
  
    
    const { name, email, password, role } = this.registerForm.value; 
  
    this.authService.register({ name, email, password, role }).subscribe({ 
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
      }
    });
  }
}