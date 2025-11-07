import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/**
 * Intercepteur global d’erreurs HTTP
 * - 401/403 : laissées à auth.interceptor
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        if (err.status === 401 || err.status === 403) {
          return throwError(() => err);
        }

        // Ecrit un message lisible pour les logs
        const backendMsg =
          (err.error && (err.error.error || err.error.message)) ||
          err.message ||
          'Une erreur est survenue.';

        console.error('[HTTP ERROR]', {
          url: err.url,
          status: err.status,
          statusText: err.statusText,
          message: backendMsg,
          payload: err.error,
        });
      }
      return throwError(() => err);
    })
  );
};
