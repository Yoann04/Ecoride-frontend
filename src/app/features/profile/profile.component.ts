import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, effect, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import type { CurrentUser } from '../../services/user.service';
import { UserService } from '../../services/user.service';
import AvatarPickerComponent from '../shared/ui/avatar-picker.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, AvatarPickerComponent],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss'],
})
export default class ProfileComponent implements OnInit {
  /** UI state */
  showPicker = false;
  activeTab: 'infos' | 'trips' | 'favorites' = 'infos';

  /** Signals */
  userSig = signal<CurrentUser | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  tripsDriver = signal<any[]>([]);
  tripsFavorites = signal<any[]>([]);

  constructor(private userService: UserService, private auth: AuthService) {
    // garde le signal user en phase avec le service
    effect(() => {
      const u = this.userService.value;
      if (u) this.userSig.set(u);
    });
  }

  /** Affichages dérivés */
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

  /** Cycle de vie */
  async ngOnInit() {
    // restaure local si présent (utile après F5)
    this.userService.bootstrapFromStorage();
    if (this.userService.value) this.userSig.set(this.userService.value);

    await this.refresh();
  }

  /** Actions */
  async refresh(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    // ✅ Corrigé : vérifie simplement si un token existe
    if (!this.auth.token) {
      this.loading.set(false);
      this.error.set("Vous n'êtes pas connecté.");
      return;
    }

    try {
      // /api/me
      await this.userService.loadMe();
      this.userSig.set(this.userService.value);

      // Trajets → best-effort (pas bloquant si échec)
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
    else console.warn('Trips by driver failed:', byDriver.reason);

    if (favorites.status === 'fulfilled') this.tripsFavorites.set(favorites.value as any[]);
    else console.warn('Favorite trips failed:', favorites.reason);
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
      if (value === null) {
        this.userService.setAvatar(''); // ou null selon ton modèle
      } else {
        this.userService.setAvatar(value);
      }
      // Met à jour l'UI locale
      this.userSig.set(this.userService.value);
      this.showPicker = false;
    } catch (e) {
      console.error(e);
      this.error.set("Échec de la mise à jour de l'avatar.");
    } finally {
      this.loading.set(false);
    }
  }

  /** Utils */
  prettyRole(role: string): string {
    const r = role?.toUpperCase?.() ?? '';
    if (r.includes('ROLE_ADMIN')) return 'Administrateur';
    if (r.includes('ROLE_USER')) return 'Utilisateur';
    return r.replace(/^ROLE_/, '').toLowerCase();
  }
}
