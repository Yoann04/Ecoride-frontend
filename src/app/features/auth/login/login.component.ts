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
      // 1) Login et stockage du token AVANT d'aller plus loin
      await firstValueFrom(
        this.auth.login({ email: this.email.trim(), password: this.password }).pipe(take(1))
      );

      // 2) Recharger le profil (/api/me) pour remplir l'en-tête et le topbar
      await this.userService.loadMe();

      // 3) Cible : returnUrl (si présent et sûr) sinon /profile
      const raw = this.route.snapshot.queryParamMap.get('returnUrl');
      const target = raw && raw.startsWith('/') ? raw : '/profile';

      // 4) Navigation immédiate (pas de setTimeout, pas d'attente guard)
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
