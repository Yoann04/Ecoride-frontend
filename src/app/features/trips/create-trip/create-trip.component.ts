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
        gap: 10px;
        font-weight: 500;
        color: #1f2937;
      }

      .check input[type='checkbox'] {
        appearance: none;
        -webkit-appearance: none;
        width: 20px;
        height: 20px;
        border: 2px solid #d1d5db;
        border-radius: 6px;
        background-color: #fff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s ease;
        cursor: pointer;
      }

      .check input[type='checkbox']:checked {
        border-color: #64a859;
        background-color: #64a859;
      }

      .check input[type='checkbox']:checked::after {
        content: '✔';
        color: #fff;
        font-size: 13px;
        font-weight: 700;
        line-height: 1;
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
  todayStr = this.today();

  form = this.fb.group(
    {
      departureCity: ['', [Validators.required, Validators.minLength(2)]],
      arrivalCity: ['', [Validators.required, Validators.minLength(2)]],

      departureDate: [this.today(), [Validators.required]],
      departureTime: [this.nextQuarterHour(), [Validators.required]],

      arrivalDate: [''],
      arrivalTime: [''],

      price: [10, [Validators.required, Validators.min(0), Validators.max(9999)]],
      availableSeats: [3, [Validators.required, Validators.min(1), Validators.max(9)]],
      isEcological: [false],

      vehicle_id: [null as number | null, [Validators.required]],
    },
    { validators: [CreateTripComponent.arrivalAfterDepartureValidator] }
  );

  static arrivalAfterDepartureValidator(group: AbstractControl) {
    const dDate = group.get('departureDate')?.value as string | null;
    const dTime = group.get('departureTime')?.value as string | null;
    const aDate = group.get('arrivalDate')?.value as string | null;
    const aTime = group.get('arrivalTime')?.value as string | null;

    if (!dDate || !dTime || !aDate || !aTime) return null;

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
    if (!this.auth.token) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/trips/new' } });
      return;
    }

    try {
      this.vehicles = await this.vehiclesApi.getMy();
      if (!this.vehicles || this.vehicles.length === 0) {
        this.router.navigate(['/vehicles/new'], { queryParams: { returnUrl: '/trips/new' } });
        return;
      }
      this.form.patchValue({ vehicle_id: this.vehicles[0].id });
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

      const priceNum = Number(
        String(v.price ?? 0)
          .toString()
          .replace(',', '.')
      );
      const timeDep =
        (v.departureTime || '').length === 5 ? `${v.departureTime}:00` : v.departureTime;
      const timeArr = v.arrivalTime
        ? v.arrivalTime.length === 5
          ? `${v.arrivalTime}:00`
          : v.arrivalTime
        : null;

      const payload = {
        origin: (v.departureCity || '').trim(),
        destination: (v.arrivalCity || '').trim(),
        departureDate: String(v.departureDate),
        departureTime: String(timeDep),
        arrivalDate: v.arrivalDate ? String(v.arrivalDate) : null,
        arrivalTime: timeArr,
        price: priceNum,
        availableSeats: Number(v.availableSeats ?? 1),
        eco: !!v.isEcological,
        vehicle_id: Number(v.vehicle_id),
      };

      const res = await this.tripsApi.createTrip(payload as any);
      if (res?.id) this.router.navigate(['/trips', res.id]);
      else this.router.navigate(['/trips']);
    } catch (e: any) {
      this.serverError = e?.error?.error || e?.message || 'Création du trajet impossible.';
    } finally {
      this.submitting = false;
    }
  }

  // Dates / heures
  private today(): string {
    const d = new Date();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }

  private nextQuarterHour(): string {
    const d = new Date();
    const minutes = d.getMinutes();
    let next = Math.ceil((minutes + 1) / 15) * 15;
    if (next === 60) {
      d.setHours(d.getHours() + 1);
      next = 0;
    }
    d.setMinutes(next);
    d.setSeconds(0);
    const hh = `${d.getHours()}`.padStart(2, '0');
    const mm = `${d.getMinutes()}`.padStart(2, '0');
    return `${hh}:${mm}`;
  }

  vehicleLabel(v: Vehicle): string {
    const brand = v.brand?.libelle || v.brand?.marque || (v as any).marque || 'Véhicule';
    const model = v.model ?? (v as any).modele ?? '';
    return `${brand}${model ? ' ' + model : ''}`;
  }
}
