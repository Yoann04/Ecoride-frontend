import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = (): boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Si déjà connecté → redirige vers le profil
  if (auth.token) {
    const returnUrl = router.url || '/profile';
    return router.createUrlTree([returnUrl === '/login' ? '/profile' : '/profile']);
  }
  return true;
};
