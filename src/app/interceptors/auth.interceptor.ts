import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // N’attache le Bearer que pour les appels /api
  const shouldAttach = req.url.startsWith('/api');

  const authReq =
    shouldAttach && auth.token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${auth.token}` } })
      : req;

  return next(authReq).pipe(
    catchError((err) => {
      if (err?.status === 401 || err?.status === 403) {
        // Token expiré ou invalide -> nettoyage + redirection
        auth.clearToken();
        const redirect = encodeURIComponent(router.url || '/');
        router.navigate(['/login'], { queryParams: { returnUrl: router.url || '/' } });
      }
      return throwError(() => err);
    })
  );
};
