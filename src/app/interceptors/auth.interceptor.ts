// src/app/interceptors/auth.interceptor.ts
import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.getToken?.() || null;

  // Détermine si c’est bien une URL /api, qu’elle soit relative ou absolue
  const url = new URL(req.url, window.location.origin);
  const isApi = url.pathname.startsWith('/api');

  const isLogin = url.pathname === '/api/login';

  // 👇 Routes publiques : GET /api/trips et GET /api/trips/{id}
  const isPublicTripsGet =
    req.method === 'GET' &&
    (url.pathname === '/api/trips' || /^\/api\/trips\/\d+$/.test(url.pathname));

  // 👉 On n’attache PAS le Bearer sur ces routes publiques
  const shouldAttachToken = isApi && !isLogin && !isPublicTripsGet && !!token;

  const authReq = shouldAttachToken
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  // Sur 401 : on évite la redirection auto pour les routes trips (on laisse l’UI dire “0 résultat”)
  const NO_REDIRECT_ON_401 = ['/api/trips', '/api/trips/by-driver', '/api/trips/favorites'];

  return next(authReq).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        if (!NO_REDIRECT_ON_401.some((p) => url.pathname.startsWith(p))) {
          auth.logout?.();
          router.navigate(['/login']);
        }
      }
      return throwError(() => err);
    })
  );
};
