import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import type { Vehicle } from '../../../models/trip.model';
import { AuthService } from '../../../services/auth.service';
import { TripService } from '../../../services/trip.service';
import { VehicleService } from '../../../services/vehicle.service';

@Component({
  selector: 'app-create-trip',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './create-trip.component.html',
  styles: [
    `
      .wrap {
        max-width: 880px;
        margin: 0 auto;
        padding: 1rem;
      }
      .titlebar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
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
      .check {
        align-self: end;
        display: flex;
        align-items: center;
        gap: 0.5rem;
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
      .muted {
        color: #777;
        font-size: 0.9rem;
      }
      .hint {
        font-size: 0.85rem;
        color: #666;
      }
      .field-error {
        color: #b00020;
        font-size: 0.85rem;
      }
    `,
  ],
})
export default class CreateTripComponent {
  private fb = inject(FormBuilder);
  private vehiclesApi = inject(VehicleService);
  private tripsApi = inject(TripService);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = true;
  vehicles: Vehicle[] = [];
  serverError = '';
  submitting = false;
  todayStr = this.today(); // pour min sur input[type=date]

  form = this.fb.group(
    {
      departureCity: ['', [Validators.required, Validators.minLength(2)]],
      arrivalCity: ['', [Validators.required, Validators.minLength(2)]],

      departureDate: [this.today(), [Validators.required]], // YYYY-MM-DD
      departureTime: [this.nextQuarterHour(), [Validators.required]], // HH:mm

      arrivalDate: [''],
      arrivalTime: [''],

      price: [10, [Validators.required, Validators.min(0), Validators.max(9999)]],
      availableSeats: [3, [Validators.required, Validators.min(1), Validators.max(9)]],
      isEcological: [false],

      vehicle_id: [null as unknown as number, [Validators.required]],
    },
    { validators: [CreateTripComponent.arrivalAfterDepartureValidator] }
  );

  static arrivalAfterDepartureValidator(group: AbstractControl) {
    const dDate = group.get('departureDate')?.value as string | null;
    const dTime = group.get('departureTime')?.value as string | null;
    const aDate = group.get('arrivalDate')?.value as string | null;
    const aTime = group.get('arrivalTime')?.value as string | null;

    if (!dDate || !dTime || !aDate || !aTime) return null; // pas d’arrivée fournie => OK

    const dep = CreateTripComponent.toDate(dDate, dTime);
    const arr = CreateTripComponent.toDate(aDate, aTime);
    if (!dep || !arr) return null;

    return arr.getTime() >= dep.getTime() ? null : { arrivalBeforeDeparture: true };
  }

  private static toDate(dateStr: string, timeStr: string): Date | null {
    try {
      const t = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
      const d = new Date(`${dateStr}T${t}`);
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }

  get f() {
    return this.form.controls;
  }

  async ngOnInit() {
    // Soft guard : si pas de token → login
    if (!this.auth.token) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/trips/new' } });
      return;
    }

    try {
      this.vehicles = await this.vehiclesApi.getMy();
      if (!this.vehicles || this.vehicles.length === 0) {
        // Aucun véhicule → on propose d’en créer un
        this.router.navigate(['/vehicles/new'], { queryParams: { returnUrl: '/trips/new' } });
        return;
      }
      // Pré-sélectionne le premier véhicule
      const firstId = this.vehicles[0].id;
      this.form.patchValue({ vehicle_id: firstId });
    } catch (e: any) {
      this.serverError = e?.message || 'Impossible de charger vos véhicules.';
    } finally {
      this.loading = false;
    }
  }

  async submit() {
    this.serverError = '';
    if (this.form.invalid || this.submitting) return;
    this.submitting = true;

    try {
      const v = this.form.getRawValue();
      const payload = {
        departureCity: (v.departureCity || '').trim(),
        arrivalCity: (v.arrivalCity || '').trim(),
        departureDate: String(v.departureDate), // YYYY-MM-DD
        departureTime: String(v.departureTime), // HH:mm
        arrivalDate: v.arrivalDate ? String(v.arrivalDate) : null,
        arrivalTime: v.arrivalTime ? String(v.arrivalTime) : null,
        price: Number(v.price ?? 0),
        availableSeats: Number(v.availableSeats ?? 1),
        isEcological: !!v.isEcological,
        vehicle_id: Number(v.vehicle_id),
      };

      const res = await this.tripsApi.createTrip(payload);
      if (res?.id) this.router.navigate(['/trips', res.id]);
      else this.router.navigate(['/trips']);
    } catch (e: any) {
      this.serverError = e?.error?.error || e?.message || 'Création du trajet impossible.';
    } finally {
      this.submitting = false;
    }
  }

  // --- Helpers dates/heures
  private today(): string {
    const d = new Date();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }
  private nextQuarterHour(): string {
    const d = new Date();
    const minutes = d.getMinutes();
    const next = Math.ceil((minutes + 1) / 15) * 15;
    d.setMinutes(next);
    d.setSeconds(0);
    const hh = `${d.getHours()}`.padStart(2, '0');
    const mm = `${d.getMinutes()}`.padStart(2, '0');
    return `${hh}:${mm}`;
  }

  vehicleLabel(v: Vehicle): string {
    const brand = v.brand?.libelle || v.brand?.marque || v.marque || 'Véhicule';
    const model = v.model ?? v.modele ?? '';
    return `${brand}${model ? ' ' + model : ''}`;
  }
}
