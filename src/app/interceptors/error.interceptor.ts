import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/**
 * Intercepteur global d’erreurs HTTP (sans UI/Toast)
 * - 401/403 : laissées à auth.interceptor (logout/redirection)
 * - autres erreurs : log console + propagation de l’erreur
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        // Laisse auth.interceptor gérer l’auth
        if (err.status === 401 || err.status === 403) {
          return throwError(() => err);
        }

        // Compose un message lisible pour les logs
        const backendMsg =
          (err.error && (err.error.error || err.error.message)) ||
          err.message ||
          'Une erreur est survenue.';

        // Log propre en console (aucun changement visuel)
        // Tu peux remplacer console.error par alert(...) si tu veux un retour minimal sans UI.
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
