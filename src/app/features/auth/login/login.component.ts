import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom, take } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export default class LoginComponent {
  email = '';
  password = '';
  rememberMe = false;
  loading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private auth: AuthService
  ) {}

  async login() {
    this.errorMessage = '';
    this.loading = true;

    try {
      // Authentifie et stocke le token
      await firstValueFrom(
        this.auth.login({ email: this.email.trim(), password: this.password }).pipe(take(1))
      );

      // Charge le profil (/api/me)
      await this.userService.loadMe();

      const currentUser = this.userService.value;
      const isAdminAccount = currentUser?.email === 'yoann@ecoride.com';

      // Cible : /admin pour le compte admin, sinon returnUrl ou /profile
      const raw = this.route.snapshot.queryParamMap.get('returnUrl');
      let target = '/profile';
      if (isAdminAccount) {
        target = '/admin';
      } else if (raw && raw.startsWith('/')) {
        target = raw;
      }

      await this.router.navigateByUrl(target, { replaceUrl: true });
    } catch (err: any) {
      this.errorMessage =
        err?.status === 401
          ? 'Email ou mot de passe incorrect.'
          : 'Une erreur est survenue lors de la connexion.';
    } finally {
      this.loading = false;
    }
  }
}
