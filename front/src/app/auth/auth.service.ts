import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { TOKEN_KEY } from './auth.interceptor';

export interface AdminUser {
  id?: number;
  nombre: string;
  email?: string;
  rol?: string;
  avatar?: string;
}

const AUTH_KEY = 'cti_auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _currentUser$ = new BehaviorSubject<AdminUser | null>(this.loadUser());
  currentUser$ = this._currentUser$.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  private loadUser(): AdminUser | null {
    const stored = localStorage.getItem(AUTH_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  login(email: string, passwordPlain: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/login`, {
      email,
      password: passwordPlain
    }).pipe(
      tap(res => {
        if (res.success && res.data) {
          const { token, user } = res.data;
          localStorage.setItem(TOKEN_KEY, token);
          
          const adminUser: AdminUser = {
            id: user.id,
            nombre: user.nombre || 'Administrador',
            email: user.email,
            rol: 'Admin',
            avatar: (user.nombre || 'A').charAt(0).toUpperCase()
          };
          
          localStorage.setItem(AUTH_KEY, JSON.stringify(adminUser));
          this._currentUser$.next(adminUser);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(AUTH_KEY);
    this._currentUser$.next(null);
    this.router.navigate(['/admin/login']);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(TOKEN_KEY) && !!localStorage.getItem(AUTH_KEY);
  }

  get currentUser(): AdminUser | null {
    return this._currentUser$.value;
  }

  verifySession(): void {
    if (!this.isAuthenticated()) return;
    this.http.get<any>(`${environment.apiUrl}/auth/me`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const u = res.data;
          const adminUser: AdminUser = {
            id: u.id,
            nombre: u.nombre || 'Administrador',
            email: u.email,
            rol: 'Admin',
            avatar: (u.nombre || 'A').charAt(0).toUpperCase()
          };
          localStorage.setItem(AUTH_KEY, JSON.stringify(adminUser));
          this._currentUser$.next(adminUser);
        }
      },
      error: () => {
        this.logout();
      }
    });
  }
}
