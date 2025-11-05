import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Vehicle } from '../../../models/trip.model';
import { VehicleService } from '../../../services/vehicle.service';

@Component({
  selector: 'app-my-vehicles',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-vehicles.component.html',
  styles: [
    `
      .wrap {
        max-width: 960px;
        margin: 0 auto;
        padding: 1rem;
      }
      .titlebar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }
      .list {
        display: grid;
        gap: 0.75rem;
      }
      .card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.9rem 1rem;
        border: 1px solid #eee;
        border-radius: 12px;
      }
      .muted {
        color: #777;
      }
      .btn {
        text-decoration: none;
        padding: 0.5rem 0.8rem;
        border-radius: 10px;
        border: 1px solid #ddd;
      }
      .btn.primary {
        border-color: transparent;
        background: #64a859;
        color: #fff;
      }
    `,
  ],
})
export default class MyVehiclesComponent {
  private api = inject(VehicleService);

  loading = true;
  error = '';
  items: Vehicle[] = [];

  async ngOnInit() {
    this.loading = true;
    this.error = '';
    try {
      this.items = await this.api.getMy();
    } catch (e: any) {
      this.error = e?.message || 'Impossible de charger vos véhicules.';
    } finally {
      this.loading = false;
    }
  }

  displayName(v: Vehicle): string {
    const brand = v.brand?.libelle || v.brand?.marque || v.marque || 'Véhicule';
    const model = v.model ?? v.modele ?? '';
    return `${brand}${model ? ' ' + model : ''}`;
  }
}
