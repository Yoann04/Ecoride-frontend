// src/app/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';

const TOKEN_KEY = 'jwt_token';

/**
 * Ajoute "Authorization: Bearer <token>" à toutes les requêtes /api
 * (sauf le POST /api/login).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // On ne met PAS le header sur l'appel de login
  const isLoginCall =
    req.method === 'POST' && (req.url.endsWith('/api/login') || req.url === '/api/login');

  if (isLoginCall) {
    return next(req);
  }

  // N'ajouter le header que pour les appels backend /api
  const isApiCall = req.url.startsWith('/api');

  const token = localStorage.getItem(TOKEN_KEY);
  if (isApiCall && token) {
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
    return next(authReq);
  }

  return next(req);
};
