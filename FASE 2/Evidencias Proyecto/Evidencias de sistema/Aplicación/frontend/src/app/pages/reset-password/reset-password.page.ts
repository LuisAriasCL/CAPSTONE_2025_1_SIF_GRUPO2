import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms'; // Importar ReactiveFormsModule
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
  standalone: true,
  imports: [IonicModule, ReactiveFormsModule, CommonModule], // Importar ReactiveFormsModule aquí
})
export class ResetPasswordPage implements OnInit {
  resetForm!: FormGroup;
  token!: string;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.queryParams['token'];
    this.resetForm = this.formBuilder.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    });
  }

  async onSubmit() {
    if (this.resetForm.value.password !== this.resetForm.value.confirmPassword) {
      alert('Las contraseñas no coinciden.');
      return;
    }

    try {
      await this.http.post('/api/auth/reset-password', {
        token: this.token,
        newPassword: this.resetForm.value.password,
      }).toPromise();

      alert('Contraseña actualizada exitosamente.');
      this.router.navigate(['/login']);
    } catch (error) {
      alert('Error al restablecer la contraseña.');
    }
  }
}