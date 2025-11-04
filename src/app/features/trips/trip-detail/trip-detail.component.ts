import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TripService } from '../../../services/trip.service';

@Component({
  standalone: true,
  selector: 'app-trip-detail',
  imports: [CommonModule, RouterLink],
  templateUrl: './trip-detail.component.html',
  styleUrls: ['./trip-detail.component.scss'],
})
export class TripDetailComponent {
  private route = inject(ActivatedRoute);
  private trips = inject(TripService);

  loading = true;
  error = '';
  trip: any = null;

  async ngOnInit() {
    try {
      const id = Number(this.route.snapshot.paramMap.get('id'));
      this.trip = await this.trips.getOne(id);
    } catch {
      this.error = 'Trajet introuvable.';
    } finally {
      this.loading = false;
    }
  }

  avatarUrl(): string {
    const u = this.trip?.driver;
    if (!u) return '/assets/avatars/default.png';
    return u.avatar || '/assets/avatars/default.png';
  }

  // --- Helpers de formatage FR ---
  toDate(d?: string | Date): string {
    if (!d) return '—';
    const dt = typeof d === 'string' ? new Date(d) : d;
    return isNaN(dt.getTime())
      ? '—'
      : dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  toTime(dateStr?: string, timeStr?: string): string {
    if (!dateStr || !timeStr) return '—';
    const t = timeStr.length === 5 ? `${timeStr}:00` : timeStr; // accepte HH:mm ou HH:mm:ss
    const dt = new Date(`${dateStr}T${t}`);
    return isNaN(dt.getTime())
      ? timeStr
      : dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
}
