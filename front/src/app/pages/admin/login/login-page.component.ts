import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss']
})
export class LoginPageComponent {
  features = [
    { icon: 'inventory_2', text: 'Gestión de productos y variantes' },
    { icon: 'category', text: 'Administración de categorías' },
    { icon: 'bar_chart', text: 'Dashboard con métricas en tiempo real' },
    { icon: 'chat', text: 'Integración con WhatsApp' },
  ];
  
  email = 'admin1@tiendaintima.com';
  password = 'Tienda-Intima123';
  isLoading = false;
  errorMessage = '';

  constructor(private auth: AuthService, private router: Router) {}

  onLogin(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor ingresa correo y contraseña.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.errorMessage = res.message || 'Error al iniciar sesión.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 401) {
          this.errorMessage = 'Correo o contraseña incorrectos.';
        } else {
          this.errorMessage = err.error?.message || 'Error al conectar con el servidor backend.';
        }
      }
    });
  }
}
