import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

export interface AdminUser {
  nombre: string;
  rol: string;
  avatar: string;
}

const MOCK_USER: AdminUser = {
  nombre: 'Administrador',
  rol: 'Admin',
  avatar: 'A',
};

const AUTH_KEY = 'cti_auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _currentUser$ = new BehaviorSubject<AdminUser | null>(this.loadUser());
  currentUser$ = this._currentUser$.asObservable();

  constructor(private router: Router) {}

  private loadUser(): AdminUser | null {
    const stored = localStorage.getItem(AUTH_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  login(): void {
    localStorage.setItem(AUTH_KEY, JSON.stringify(MOCK_USER));
    this._currentUser$.next(MOCK_USER);
    this.router.navigate(['/admin/dashboard']);
  }

  logout(): void {
    localStorage.removeItem(AUTH_KEY);
    this._currentUser$.next(null);
    this.router.navigate(['/admin/login']);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(AUTH_KEY);
  }

  get currentUser(): AdminUser | null {
    return this._currentUser$.value;
  }
}
