import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { VehicleService } from '../../../services/vehicle.service';

@Component({
  selector: 'app-create-vehicle',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './create-vehicle.component.html',
  styles: [
    `
      .wrap {
        max-width: 720px;
        margin: 0 auto;
        padding: 1rem;
      }
      .form {
        display: grid;
        gap: 1rem;
      }
      .grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      }
      .field {
        display: grid;
        gap: 0.35rem;
      }
      input,
      select {
        padding: 0.6rem 0.7rem;
        border: 1px solid #ddd;
        border-radius: 10px;
      }
      .actions {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
      }
      .ghost {
        background: transparent;
        border: 1px solid #ddd;
        padding: 0.6rem 0.9rem;
        border-radius: 10px;
        text-decoration: none;
      }
      button {
        padding: 0.6rem 0.9rem;
        border-radius: 10px;
      }
      .error {
        color: #c0392b;
      }
    `,
  ],
})
export default class CreateVehicleComponent {
  private fb = inject(FormBuilder);
  private api = inject(VehicleService);
  private router = inject(Router);
  private auth = inject(AuthService);

  serverError = '';
  submitting = false;

  form = this.fb.group({
    marque: ['', [Validators.required, Validators.minLength(2)]],
    model: ['', [Validators.required, Validators.minLength(1)]],
    immatriculation: ['', [Validators.required, Validators.pattern(/^[A-Z0-9\-]{3,15}$/i)]],
    places: [4, [Validators.required, Validators.min(1), Validators.max(9)]],
    energy_type: ['THERMAL'],
    is_ecological: [false],
  });

  get f() {
    return this.form.controls;
  }

  async submit() {
    this.serverError = '';
    if (this.form.invalid || this.submitting) return;

    if (!this.auth.token) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/vehicles/new' } });
      return;
    }

    this.submitting = true;
    try {
      const v = this.form.getRawValue();
      await this.api.create({
        marque: (v.marque || '').trim(),
        model: (v.model || '').trim(),
        immatriculation: String(v.immatriculation || '')
          .toUpperCase()
          .trim(),
        places: Number(v.places ?? 1),
        energy_type: v.energy_type || null,
        is_ecological: !!v.is_ecological,
      });

      // Redirige vers la liste
      const returnUrl = history.state?.navigationId ? null : null;
      this.router.navigate(['/vehicles']);
    } catch (e: any) {
      this.serverError = e?.error?.error || e?.message || 'Création impossible.';
    } finally {
      this.submitting = false;
    }
  }
}
