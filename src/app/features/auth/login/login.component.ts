import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class LoginComponent {
  loading = signal(false);
  errorMsg = signal<string | null>(null);
  successMsg = signal<string | null>(null);
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService, // ✅ nouveau
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const { email, password } = this.form.value;
    this.loading.set(true);
    this.errorMsg.set(null);

    this.authService.login(email!, password!).subscribe({
      next: async () => {
        this.loading.set(false);
        await this.userService.loadMe(); // ✅ récupère le /api/me
        this.router.navigate(['/home']); // ✅ redirige vers /home
      },
      error: () => {
        this.loading.set(false);
        this.errorMsg.set('Identifiants incorrects.');
      },
    });
  }
}
