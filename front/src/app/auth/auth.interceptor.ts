import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const TOKEN_KEY = 'cti_token';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem(TOKEN_KEY);

  // Adjuntar Authorization Header si hay token y es una petición a nuestra API
  let authReq = req;
  if (token && req.url.includes('/api/')) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si el backend responde 401 (token expirado o inválido), redirigir al login
      if (error.status === 401 && !req.url.includes('/auth/login')) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('cti_auth');
        router.navigate(['/admin/login']);
      }
      return throwError(() => error);
    })
  );
};
