import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import type { CurrentUser } from '../../services/user.service';
import { UserService } from '../../services/user.service';

import type { Vehicle } from '../../models/trip.model';
import { TripService } from '../../services/trip.service';
import { VehicleService } from '../../services/vehicle.service';

import AvatarPickerComponent from '../shared/ui/avatar-picker.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, AvatarPickerComponent],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss'],
})
export default class ProfileComponent implements OnInit, OnDestroy {
  private readonly userService = inject(UserService);
  private readonly auth = inject(AuthService);
  private readonly vehiclesApi = inject(VehicleService);
  private readonly trips = inject(TripService);
  private readonly cdr = inject(ChangeDetectorRef);

  showPicker = false;
  activeTab: 'infos' | 'trips' | 'favorites' = 'infos';

  userSig = signal<CurrentUser | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  tripsDriver = signal<any[]>([]);
  tripsFavorites = signal<any[]>([]);
  vehiclesSig = signal<Vehicle[]>([]);

  avatarV = signal<number>(Date.now());
  private sub = new Subscription();

  /** Date fictive si backend ne renvoie rien */
  private readonly DEFAULT_CREATED_AT = '2025-11-04T12:00:00Z';

  constructor() {
    effect(() => {
      const u = this.userService.value;
      if (u) this.userSig.set(u);
    });
  }

  displayName = computed(() => {
    const u = this.userSig();
    if (!u) return '';
    if (u.prenom && u.nom) return `${u.prenom} ${u.nom}`;
    return u.email ?? '';
  });

  initials = computed(() => {
    const u = this.userSig();
    const letters = (u?.prenom?.[0] ?? '') + (u?.nom?.[0] ?? '');
    return (letters || u?.email?.[0] || '?').toUpperCase();
  });

  async ngOnInit() {
    // Rafraîchissement avatar
    this.sub.add(
      this.userService.avatarRefresh$.subscribe((v) => {
        this.avatarV.set(v);
        this.cdr.markForCheck();
      })
    );

    this.sub.add(
      this.userService.favoritesRefresh$.subscribe(() => {
        this.reloadFavorites();
      })
    );

    this.userService.bootstrapFromStorage();
    if (this.userService.value) this.userSig.set(this.userService.value);

    await this.refresh();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  private ensureCreatedAt() {
    const u = this.userSig();
    if (!u) return;
    if (!u.createdAt || String(u.createdAt).trim() === '') {
      const patched: CurrentUser = { ...u, createdAt: this.DEFAULT_CREATED_AT };
      this.userService.setCurrentUser(patched);
      this.userSig.set(patched);
    }
  }

  async refresh(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    if (!this.auth.token) {
      this.loading.set(false);
      this.error.set("Vous n'êtes pas connecté.");
      return;
    }

    try {
      await this.userService.loadMe();
      this.userSig.set(this.userService.value);

      // S'assure d'afficher une date
      this.ensureCreatedAt();

      // véhicules
      try {
        const list = await this.vehiclesApi.getMy();
        this.vehiclesSig.set(list || []);
      } catch {}

      await this.loadTripsBestEffort();
    } catch {
      this.error.set('Impossible de charger votre profil.');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadTripsBestEffort() {
    try {
      const mine = await this.trips.byDriver();
      this.tripsDriver.set(mine || []);
      if (!mine || mine.length === 0) {
        const me = this.userSig();
        console.log('[profil] Aucun trajet pour le driver connecté', {
          userId: me?.id,
          email: me?.email,
        });
      }
    } catch (e) {
      console.error('[profil] byDriver a échoué', e);
      this.tripsDriver.set([]);
    }

    try {
      const favs = await this.userService.getFavoriteTrips();
      this.tripsFavorites.set(favs || []);
    } catch {
      this.tripsFavorites.set([]);
    }
  }

  private async reloadFavorites() {
    try {
      const favs = await this.userService.getFavoriteTrips();
      this.tripsFavorites.set(favs || []);
      this.cdr.markForCheck();
    } catch {}
  }

  setTab(tab: 'infos' | 'trips' | 'favorites') {
    this.activeTab = tab;
  }

  /** Avatar picker */
  onCancelPick(): void {
    this.showPicker = false;
  }

  async onPickAvatar(value: string | null): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.userService.setAvatar(value ?? '');
      this.userSig.set(this.userService.value);
      this.showPicker = false;
    } catch (e) {
      console.error(e);
      this.error.set("Échec de la mise à jour de l'avatar.");
    } finally {
      this.loading.set(false);
    }
  }

  tripOrigin(t: any): string {
    return t?.origin ?? t?.departureCity ?? t?.depart ?? '—';
  }
  tripDestination(t: any): string {
    return t?.destination ?? t?.arrivalCity ?? t?.arrivee ?? '—';
  }
  tripDate(t: any): string | null {
    return t?.departureDate ?? t?.date ?? null;
  }
  tripSeats(t: any): number | string {
    return t?.availableSeats ?? t?.places ?? '—';
  }
  tripPrice(t: any): number {
    const v = t?.price ?? t?.prix ?? 0;
    return typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.')) || 0;
  }
  prettyRole(role: string): string {
    const r = role?.toUpperCase?.() ?? '';
    if (r.includes('ROLE_ADMIN')) return 'Administrateur';
    if (r.includes('ROLE_USER')) return 'Utilisateur';
    if (r.includes('DRIVER') || role.toLowerCase() === 'driver') return 'Conducteur';
    return r.replace(/^ROLE_/, '').toLowerCase();
  }

  vehicleLabel(v?: any): string {
    if (!v) return '';
    const brand =
      typeof v.brand === 'string' ? v.brand : v.brand?.libelle ?? v.brand?.marque ?? v.marque ?? '';
    const model = v.model ?? v.modele ?? '';
    const head = (brand || 'Véhicule').trim();
    return model ? `${head} ${model}` : head;
  }

  avatarUrl(u?: CurrentUser | null): string {
    const src = (u?.avatar ?? '').trim();
    const url = this.makeAbsolute(src) || '/assets/illustrations/Avatar2.png';
    return `${url}?v=${this.avatarV()}`;
  }

  private makeAbsolute(url?: string | null): string {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    const normalized = url.startsWith('/') ? url : `/${url}`;
    return `${window.location.origin}${normalized}`;
  }
}
