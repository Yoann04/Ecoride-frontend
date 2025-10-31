import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html', // <- ici
  styleUrls: ['./forgot-password.component.scss'], // <- et ici
})
export default class ForgotPasswordComponent {
  email = '';
  loading = false;
  done = false;
  errorMessage = '';

  constructor(private router: Router) {}

  async submit() {
    this.loading = true;
    this.errorMessage = '';
    try {
      await new Promise<void>((res) => setTimeout(res, 600)); // simulation
      this.done = true;
    } catch {
      this.errorMessage = 'Une erreur est survenue.';
    } finally {
      this.loading = false;
    }
  }
}
