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
import { VehicleService } from '../../services/vehicle.service';

// Composant modal d’avatar
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
  private readonly cdr = inject(ChangeDetectorRef);

  /** === UI === */
  showPicker = false;
  activeTab: 'infos' | 'trips' | 'favorites' = 'infos';

  /** === State === */
  userSig = signal<CurrentUser | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  tripsDriver = signal<any[]>([]);
  tripsFavorites = signal<any[]>([]);
  vehiclesSig = signal<Vehicle[]>([]);

  /** Anti-cache avatar */
  avatarV = signal<number>(Date.now());
  private sub = new Subscription();

  /** 👉 date fictive si backend ne renvoie rien */
  private readonly DEFAULT_CREATED_AT = '2025-11-04T12:00:00Z';

  constructor() {
    effect(() => {
      const u = this.userService.value;
      if (u) this.userSig.set(u);
    });
  }

  // ==== Affichages dérivés ====
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
    // Rafraîchissement avatar (anti-cache)
    this.sub.add(
      this.userService.avatarRefresh$.subscribe((v) => {
        this.avatarV.set(v);
        this.cdr.markForCheck();
      })
    );

    // 🔁 Rafraîchissement des favoris (AJOUT/SUPPRESSION depuis ailleurs)
    this.sub.add(
      this.userService.favoritesRefresh$.subscribe(() => {
        // Recharge uniquement la liste des favoris (rapide)
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

  // ==== Actions ====
  private ensureCreatedAt() {
    const u = this.userSig();
    if (!u) return;
    if (!u.createdAt || String(u.createdAt).trim() === '') {
      // on force une date fictive
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

      // ✅ s'assure qu'on a une date à afficher
      this.ensureCreatedAt();

      // véhicules (non bloquant)
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
    const [byDriver, favorites] = await Promise.allSettled([
      this.userService.getTripsByDriver?.() ?? Promise.resolve([]),
      this.userService.getFavoriteTrips?.() ?? Promise.resolve([]),
    ]);
    if (byDriver.status === 'fulfilled') this.tripsDriver.set(byDriver.value as any[]);
    if (favorites.status === 'fulfilled') this.tripsFavorites.set(favorites.value as any[]);
  }

  /** 🔁 Recharge ciblé des favoris (appelé quand favoritesRefresh$ émet) */
  private async reloadFavorites() {
    try {
      const favs = await this.userService.getFavoriteTrips();
      this.tripsFavorites.set(favs || []);
      // si l’utilisateur est sur l’onglet “favorites”, l’UI se met à jour direct
      this.cdr.markForCheck();
    } catch {
      // on ne casse pas l’UI si l’appel échoue ponctuellement
    }
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

  // Utils d'affichage
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
  vehicleLabel(v?: Vehicle | null): string {
    if (!v) return '';
    const brand = (v.brand?.libelle || v.brand?.marque || v.marque || '').trim();
    const model = (v.model ?? v.modele ?? '').trim();
    const head = brand || 'Véhicule';
    return model ? `${head} ${model}` : head;
  }

  /** URL avatar + anti-cache */
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
