// src/app/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const isApi = req.url.startsWith('/api');
  const token = auth.token;
  const hadAuthHeader = isApi && !!token;

  const authReq = hadAuthHeader
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err) => {
      // ➜ On ne « casse » la session que si la requête portait un Bearer
      if (hadAuthHeader && (err?.status === 401 || err?.status === 403)) {
        auth.clearToken();
        const returnUrl = router.url || '/';
        router.navigate(['/login'], { queryParams: { returnUrl } });
      }
      return throwError(() => err);
    })
  );
};
