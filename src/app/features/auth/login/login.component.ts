// login.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
    private userService: UserService,
    private auth: AuthService
  ) {}

  async login() {
    this.errorMessage = '';
    this.loading = true;
    try {
      // ✅ identifiants de démo (garde ce que tu veux afficher dans la page)
      const ok =
        this.email.trim().toLowerCase() === 'alice@example.com' && this.password === 'Password123!';

      if (ok) {
        // on sauvegarde un "profil" minimal (démo)
        this.userService.setCurrentUser({
          id: 1,
          email: this.email,
          nom: 'Dupont',
          prenom: 'Alice',
          roles: ['ROLE_USER'],
        });

        // ✅ surtout : on écrit le token avec la MÊME clé que le guard lit
        this.auth.setToken('fake-demo-token');

        // ✅ redirection vers le profil (le guard te laissera passer)
        await this.router.navigate(['/profile']);
        return;
      }

      this.errorMessage = 'Email ou mot de passe incorrect.';
    } catch (e) {
      console.error(e);
      this.errorMessage = 'Une erreur est survenue.';
    } finally {
      this.loading = false;
    }
  }
}
