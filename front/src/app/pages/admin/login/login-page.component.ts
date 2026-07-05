import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  isLoading = false;

  constructor(private auth: AuthService) {}

  onLogin(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.isLoading = true;
    this.auth.login();
  }
}
