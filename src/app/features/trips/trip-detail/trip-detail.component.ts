import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Trip } from '../../../models/trip.model';
import { AuthService } from '../../../services/auth.service';
import { TripService } from '../../../services/trip.service';
import { UserService } from '../../../services/user.service';

@Component({
  standalone: true,
  selector: 'app-trip-detail',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './trip-detail.component.html',
  styleUrls: ['./trip-detail.component.scss'],
})
export class TripDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private trips = inject(TripService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);

  private sub?: Subscription;
  private avatarV = Date.now();

  loading = true;
  error = '';
  trip: Trip | null = null;

  favBusy = false;
  reserveBusy = false;

  Math = Math;

  ngOnInit() {
    this.sub = this.userService.avatarRefresh$.subscribe((v) => {
      this.avatarV = v || Date.now();
      this.cdr.markForCheck();
    });
    this.init();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  private async init() {
    try {
      const id = Number(this.route.snapshot.paramMap.get('id'));
      if (!id) throw new Error('ID invalide');
      this.trip = await this.trips.getOne(id);

      try {
        const fav = await this.trips.isFavorite(id);
        if (this.trip) this.trip = { ...this.trip, isFavorite: fav };
      } catch {}

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
      } catch {}
    } catch {
      this.error = 'Trajet introuvable.';
    } finally {
      this.loading = false;
    }
  }

  private makeAbsolute(url?: string | null): string {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    const normalized = url.startsWith('/') ? url : `/${url}`;
    return `${window.location.origin}${normalized}`;
  }

  private withCacheBuster(url: string, v: number): string {
    return url ? (url.includes('?') ? `${url}&v=${v}` : `${url}?v=${v}`) : '';
  }

  avatarUrl(d?: { id?: number; avatar?: string | null }): string {
    if (!d) return '';
    const me = this.userService.value;
    const src = d.id === me?.id ? me?.avatar || '' : d.avatar || '';
    if (!src) return '';
    return this.withCacheBuster(this.makeAbsolute(src), this.avatarV);
  }

  initials(u: { prenom?: string; nom?: string; pseudo?: string; email?: string } = {}): string {
    if (u.pseudo && u.pseudo.trim()) {
      const letters = u.pseudo.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, '').slice(0, 2);
      return (letters || '?').toUpperCase();
    }
    const p = u.prenom?.[0] ?? '';
    const n = u.nom?.[0] ?? '';
    const fb = u.email?.[0] ?? '?';
    return (p + n || fb).toUpperCase();
  }

  onAvatarError(ev: Event): void {
    const img = ev.target as HTMLImageElement;
    if (img) img.style.display = 'none';
  }

  brandLabel(): string {
    const v: any = this.trip?.vehicle;
    if (!v) return '—';
    const brand = v.brand?.libelle ?? v.brand?.marque ?? v.marque ?? '';
    const model = v.model ?? v.modele ?? '';
    const label = `${brand} ${model}`.trim();
    return label || '—';
  }

  isEco(): boolean {
    if (this.trip?.isEcological) return true;
    const v: any = this.trip?.vehicle ?? {};
    const type = String(v.energy_type || v.energyType || '').toLowerCase();
    if (type.includes('electric') || type.includes('électrique')) return true;
    const label = `${this.brandLabel()} ${v.energy_type || ''}`.toLowerCase();
    const electricHints = [
      'tesla',
      'model',
      'ev',
      'bev',
      'electric',
      'électrique',
      'y long range',
      'y performance',
    ];
    return electricHints.some((k) => label.includes(k));
  }

  isFav(): boolean {
    return !!this.trip?.isFavorite;
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

  async toggleFavorite() {
    if (!this.trip) return;
    if (!this.isLoggedIn()) return this.goLogin();
    if (this.favBusy) return;

    this.favBusy = true;
    const prev = !!this.trip.isFavorite;
    this.trip = { ...this.trip, isFavorite: !prev }; // UI optimiste

    try {
      if (prev) {
        await this.trips.removeFavorite(this.trip.id);
      } else {
        await this.trips.addFavorite(this.trip.id);
      }
      // ✅ notifie le reste de l’app (profil, liste favoris)
      this.userService.notifyFavoritesChanged();
    } catch {
      this.trip = { ...this.trip, isFavorite: prev };
      alert('Impossible de mettre à jour le favori.');
    } finally {
      this.favBusy = false;
    }
  }

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

  isLoggedIn(): boolean {
    return !!this.auth.token;
  }

  goLogin() {
    const id = this.trip?.id ?? '';
    this.router.navigate(['/login'], { queryParams: { returnUrl: `/trips/${id}` } });
  }
}
