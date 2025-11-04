// src/app/features/auth/login/login.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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

    this.auth.login(this.email.trim(), this.password).subscribe({
      next: async (resp) => {
        try {
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/profile';

          // 1) Démo : pas d'appel /api/me
          if (resp?.demo) {
            this.router.navigate([returnUrl]);
            return;
          }

          // 2) Vrai backend : on charge le profil
          await this.userService.loadMe();
          this.router.navigate([returnUrl]);
        } catch {
          this.errorMessage = 'Connexion ok mais impossible de charger votre profil.';
        } finally {
          this.loading = false;
        }
      },
      error: (err) => {
        this.errorMessage =
          err?.status === 401 ? 'Email ou mot de passe incorrect.' : 'Une erreur est survenue.';
        this.loading = false;
      },
    });
  }
}
