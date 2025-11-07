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
  driverAvg = 0;
  driverCount = 0;

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

      await this.loadDriverStats();

      // Favoris
      try {
        const fav = await this.trips.isFavorite(id);
        if (this.trip) this.trip = { ...this.trip, isFavorite: fav };
      } catch {}

      // Places restantes
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

  /** Calcule la note et le nombre d’avis du conducteur */
  private async loadDriverStats() {
    const reviews: any[] = (this.trip as any)?.reviews ?? [];
    if (reviews.length > 0) {
      const total = reviews.reduce((acc, r) => acc + (Number(r?.rating) || 0), 0);
      this.driverCount = reviews.length;
      this.driverAvg = Math.round((total / this.driverCount) * 10) / 10;
      return;
    }

    const driverId = (this.trip as any)?.driver?.id;
    if (!driverId) {
      this.driverAvg = 0;
      this.driverCount = 0;
      return;
    }
    try {
      const s = await this.trips.getDriverSummary(driverId);
      this.driverAvg = Number(s?.avg ?? 0);
      this.driverCount = Number(s?.count ?? 0);
    } catch {
      this.driverAvg = 0;
      this.driverCount = 0;
    }
  }

  toDateFR(dateStr?: string): string {
    if (!dateStr) return '—';
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
    if (!m) return dateStr;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return d.toLocaleDateString('fr-FR');
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

  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
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
    return ['tesla', 'model', 'ev', 'bev', 'electric', 'électrique'].some((k) => label.includes(k));
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

  async toggleFavorite() {
    if (!this.trip) return;
    if (!this.isLoggedIn()) return this.goLogin();
    if (this.favBusy) return;

    this.favBusy = true;
    const prev = !!this.trip.isFavorite;
    this.trip = { ...this.trip, isFavorite: !prev };

    try {
      if (prev) await this.trips.removeFavorite(this.trip.id);
      else await this.trips.addFavorite(this.trip.id);
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
