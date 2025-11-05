import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Review, Trip } from '../../../models/trip.model';
import { AuthService } from '../../../services/auth.service';
import { TripService } from '../../../services/trip.service';

@Component({
  standalone: true,
  selector: 'app-trip-detail',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './trip-detail.component.html',
})
export class TripDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private trips = inject(TripService);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = true;
  error = '';
  trip: Trip | null = null;

  // Avis
  newRating = 5;
  newComment = '';
  sending = false;
  sendError = '';
  sendOk = false;

  // États actions
  favBusy = false;
  reserveBusy = false;

  async ngOnInit() {
    try {
      const id = Number(this.route.snapshot.paramMap.get('id'));
      if (!id) throw new Error('ID invalide');

      this.trip = await this.trips.getOne(id);

      // Optionnel : état favori si l’API séparée est active
      try {
        const fav = await this.trips.isFavorite(id);
        if (this.trip) this.trip = { ...this.trip, isFavorite: fav };
      } catch {
        /* endpoint non exposé → ignore */
      }

      // Statut de réservation
      try {
        const status = await this.trips.getTripStatus(id);
        if (this.trip) {
          this.trip = {
            ...this.trip,
            reserved: status.reserved,
            availableSeats:
              typeof status.seatsLeft === 'number' ? status.seatsLeft : this.trip.availableSeats,
          };
        }
      } catch {
        /* non bloquant */
      }
    } catch {
      this.error = 'Trajet introuvable.';
    } finally {
      this.loading = false;
    }
  }

  // --- Auth
  isLoggedIn(): boolean {
    return !!this.auth.token;
  }

  goLogin() {
    const id = this.trip?.id ?? '';
    this.router.navigate(['/login'], { queryParams: { returnUrl: `/trips/${id}` } });
  }

  // --- Helpers d’affichage
  avatarUrl(): string {
    const u = this.trip?.driver;
    if (!u) return '/assets/avatars/default.png';
    return u.avatar || '/assets/avatars/default.png';
  }

  brandLabel(): string {
    const b: any = this.trip?.vehicle?.brand ?? {};
    return b?.libelle ?? b?.marque ?? '—';
  }

  toTime(dateStr?: string, timeStr?: string): string {
    if (!dateStr || !timeStr) return '—';
    const t = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
    const dt = new Date(`${dateStr}T${t}`);
    return isNaN(dt.getTime())
      ? timeStr
      : dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  reviewsCount(): number {
    return this.trip?.reviews?.length ?? 0;
  }

  averageRating(): number {
    const reviews = this.trip?.reviews ?? [];
    if (!reviews.length) return 0;
    const total = reviews.reduce((acc, r) => acc + (r.rating ?? 0), 0);
    return Math.round((total / reviews.length) * 10) / 10;
  }

  // --- Avis
  private clampRating(n: number): number {
    if (Number.isNaN(+n)) return 5;
    return Math.max(1, Math.min(5, Math.round(+n)));
  }

  async submitReview() {
    if (!this.trip) return;
    if (!this.isLoggedIn()) return this.goLogin();

    this.sendError = '';
    this.sendOk = false;
    this.sending = true;

    try {
      const rating = this.clampRating(this.newRating);
      const comment = this.newComment.trim();
      if (comment.length < 3) throw new Error('Le commentaire doit faire au moins 3 caractères.');

      await this.trips.addReview(this.trip.id, rating, comment);
      const reviews = (await this.trips.getReviewsForTrip(this.trip.id)) as Review[];
      this.trip = { ...this.trip, reviews };

      this.newRating = 5;
      this.newComment = '';
      this.sendOk = true;
    } catch (e: any) {
      this.sendError = e?.error?.error || e?.message || "Impossible d'envoyer l'avis.";
    } finally {
      this.sending = false;
    }
  }

  // --- Favori (toggle optimiste)
  async toggleFavorite() {
    if (!this.trip) return;
    if (!this.isLoggedIn()) return this.goLogin();
    if (this.favBusy) return;

    this.favBusy = true;
    const prev = !!this.trip.isFavorite;

    // UI optimiste
    this.trip = { ...this.trip, isFavorite: !prev };

    try {
      if (prev) await this.trips.removeFavorite(this.trip.id);
      else await this.trips.addFavorite(this.trip.id);
    } catch {
      // rollback si échec
      this.trip = { ...this.trip, isFavorite: prev };
      alert('Impossible de mettre à jour le favori.');
    } finally {
      this.favBusy = false;
    }
  }

  // --- Réservation
  async reserve() {
    if (!this.trip) return;
    if (!this.isLoggedIn()) return this.goLogin();
    if (this.reserveBusy) return;

    this.reserveBusy = true;
    try {
      const res = await this.trips.reserveTrip(this.trip.id);
      this.trip = { ...this.trip, availableSeats: res.seatsLeft, reserved: true };
    } catch (e: any) {
      alert(e?.error?.error || e?.message || 'Réservation impossible.');
    } finally {
      this.reserveBusy = false;
    }
  }

  async cancelReservation() {
    if (!this.trip) return;
    if (!this.isLoggedIn()) return this.goLogin();
    if (this.reserveBusy) return;

    this.reserveBusy = true;
    try {
      const res = await this.trips.cancelReservation(this.trip.id);
      this.trip = { ...this.trip, availableSeats: res.seatsLeft, reserved: false };
    } catch (e: any) {
      alert(e?.error?.error || e?.message || 'Annulation impossible.');
    } finally {
      this.reserveBusy = false;
    }
  }
}
