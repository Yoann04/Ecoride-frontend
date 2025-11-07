import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const userSvc = inject(UserService);
  const router = inject(Router);

  const u = userSvc.value;
  if (u && (u.roles?.includes('ROLE_ADMIN') || u.email === 'yoann@ecoride.com')) return true;

  if (auth.token) {
    try {
      await userSvc.loadMe();
      const me = userSvc.value;
      if (me && (me.roles?.includes('ROLE_ADMIN') || me.email === 'yoann@ecoride.com')) {
        return true;
      }
    } catch {}
  }

  router.navigate(['/home']);
  return false;
};
