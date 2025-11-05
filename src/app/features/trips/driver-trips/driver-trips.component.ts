import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Trip } from '../../../models/trip.model';
import { TripService } from '../../../services/trip.service';

@Component({
  selector: 'app-driver-trips',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './driver-trips.component.html',
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
      .when {
        font-size: 0.9rem;
        color: #666;
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
export default class DriverTripsComponent {
  private tripsApi = inject(TripService);

  loading = true;
  error = '';
  items: Trip[] = [];

  async ngOnInit() {
    this.loading = true;
    this.error = '';
    try {
      this.items = await this.tripsApi.byDriver();
    } catch (e: any) {
      this.error = e?.message || 'Impossible de charger vos trajets.';
    } finally {
      this.loading = false;
    }
  }

  when(t: Trip): string {
    try {
      const d = new Date(`${t.departureDate}T${t.departureTime ?? '00:00'}:00`);
      if (isNaN(d.getTime())) return `${t.departureDate} ${t.departureTime ?? ''}`.trim();
      return d.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return t.departureDate;
    }
  }
}
