import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { Trip } from '../../models/trip.model';
import { AuthService } from '../../services/auth.service';
import { TripSearchFilters, TripService } from '../../services/trip.service';
import { CurrentUser, UserService } from '../../services/user.service';

@Component({
  selector: 'app-trip-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './trip-search.component.html',
  styleUrls: ['./trip-search.component.scss'],
})
export default class TripSearchComponent implements OnInit, OnDestroy {
  origin = '';
  destination = '';
  date = '';

  sort: TripSearchFilters['sort'] = 'departureDate';
  order: TripSearchFilters['order'] = 'ASC';
  page = 1;
  limit = 20;

  // State
  loading = false;
  error = '';
  trips: Trip[] = [];
  total = 0;

  // Rafraîchir l'image si l'utilisateur change d'avatar
  private avatarVersion = Date.now();
  private sub?: Subscription;

  private tripsApi = inject(TripService);
  private auth = inject(AuthService);
  private users = inject(UserService);

  ngOnInit(): void {
    this.sub = this.users.currentUser$.subscribe((u) => {
      if (!u) return;
      this.patchTripsWithCurrentUser(u);
      this.avatarVersion = Date.now();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  isLoggedIn(): boolean {
    return !!this.auth.token;
  }

  async search() {
    this.loading = true;
    this.error = '';
    try {
      const res = await this.tripsApi.search({
        origin: this.origin?.trim() || undefined,
        destination: this.destination?.trim() || undefined,
        dateFrom: this.date || undefined,
        sort: this.sort,
        order: this.order,
        page: this.page,
        limit: this.limit,
      });

      this.trips = res.items || [];
      this.total = res.total ?? this.trips.length;

      const me = this.users.value;
      if (me) this.patchTripsWithCurrentUser(me);
    } catch (e: any) {
      this.error =
        e?.error?.error || e?.message || "Impossible d'effectuer la recherche pour le moment.";
      this.trips = [];
      this.total = 0;
    } finally {
      this.loading = false;
    }
  }

  onSortChange(value: string) {
    const [field, dir] = (value || '').split('-') as ['date' | 'price', 'asc' | 'desc'];
    this.sort = field === 'price' ? 'price' : 'departureDate';
    this.order = dir === 'desc' ? 'DESC' : 'ASC';
    this.search();
  }

  fullName(t: Trip): string {
    const n = t.driver?.prenom
      ? `${t.driver.prenom} ${t.driver.nom ?? ''}`.trim()
      : t.driver?.pseudo;
    return n || 'Conducteur';
  }

  /* ===== Avatars ===== */
  hasAvatar(t: Trip): boolean {
    return !!(t?.driver?.avatar && t.driver.avatar.trim());
  }

  avatarUrl(t: Trip): string {
    const raw = (t?.driver?.avatar ?? '').trim();
    if (!raw) return '';

    const abs = this.makeAbsolute(raw);
    const me = this.users.value;
    if (me && t?.driver?.id === me.id) {
      const sep = abs.includes('?') ? '&' : '?';
      return `${abs}${sep}v=${this.avatarVersion}`;
    }
    return abs;
  }

  driverInitials(t: Trip): string {
    const pseudo = (t.driver?.pseudo ?? '').trim();
    if (pseudo)
      return (
        pseudo
          .replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, '')
          .slice(0, 2)
          .toUpperCase() || '?'
      );
    const p = (t.driver?.prenom ?? '').trim();
    const n = (t.driver?.nom ?? '').trim();
    const letters = (p[0] ?? '') + (n[0] ?? '');
    return (letters || (t.driver?.email?.[0] ?? '?')).toUpperCase();
  }

  private makeAbsolute(url?: string | null): string {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    const normalized = url.startsWith('/') ? url : `/${url}`;
    return `${window.location.origin}${normalized}`;
  }

  private patchTripsWithCurrentUser(u: CurrentUser) {
    if (!u?.id) return;
    const newAvatar = (u.avatar ?? '').trim();
    this.trips = this.trips.map((t) =>
      t?.driver?.id === u.id ? { ...t, driver: { ...(t.driver as any), avatar: newAvatar } } : t
    );
  }
}
