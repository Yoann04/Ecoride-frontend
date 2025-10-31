import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export default class RegisterComponent {
  prenom = '';
  nom = '';
  email = '';
  password = '';
  loading = false;
  errorMessage = '';

  constructor(private router: Router) {}

  async register() {
    this.loading = true;
    this.errorMessage = '';
    try {
      // TODO: appeler votre API /api/register ici
      // Simulation succès :
      await new Promise((res) => setTimeout(res, 600));
      this.router.navigate(['/login']);
    } catch {
      this.errorMessage = 'Impossible de créer le compte pour le moment.';
    } finally {
      this.loading = false;
    }
  }
}
