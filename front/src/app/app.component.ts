import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
  styles: [`:host { display: block; }`]
})
export class AppComponent implements OnInit {
  title = 'catalogo-tienda-intima';

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    this.auth.verifySession();
  }
}
