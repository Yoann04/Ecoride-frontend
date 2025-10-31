import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, effect, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CurrentUser, UserService } from '../../services/user.service';
import TopbarComponent from '../shared/ui/topbar.component';
import AvatarPickerComponent from './avatar-picker.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, TopbarComponent, AvatarPickerComponent],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss'],
})
export default class ProfileComponent implements OnInit {
  showPicker = false;
  activeTab: 'infos' | 'trips' | 'favorites' = 'infos';

  userSig = signal<CurrentUser | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  tripsDriver = signal<any[]>([]);
  tripsFavorites = signal<any[]>([]);

  constructor(private userService: UserService, private auth: AuthService) {
    // keep local signal in sync if user changes elsewhere
    effect(() => {
      const u = this.userService.value;
      if (u) this.userSig.set(u);
    });
  }

  displayName = computed(() => {
    const u = this.userSig();
    return u ? (u.prenom && u.nom ? `${u.prenom} ${u.nom}` : u.email) : '';
  });

  initials = computed(() => {
    const u = this.userSig();
    const letters = (u?.prenom?.[0] ?? '') + (u?.nom?.[0] ?? '');
    return (letters || u?.email?.[0] || '?').toUpperCase();
  });

  async ngOnInit() {
    this.loading.set(true);
    this.error.set(null);

    // Always restore what we have first (demo or real)
    this.userService.bootstrapFromStorage();
    if (this.userService.value) {
      this.userSig.set(this.userService.value);
    }

    // --- DEMO MODE: never call the API ---
    if (this.auth.isDemo()) {
      this.tripsDriver.set([]); // could put sample data here if you want
      this.tripsFavorites.set([]);
      this.loading.set(false);
      return;
    }

    // --- REAL TOKEN: call backend ---
    if (this.auth.hasToken()) {
      try {
        await this.userService.loadMe();
        this.userSig.set(this.userService.value);
        this.tripsDriver.set(await this.userService.getTripsByDriver());
        this.tripsFavorites.set(await this.userService.getFavoriteTrips());
      } catch {
        this.error.set('Impossible de charger votre profil ou vos trajets.');
      } finally {
        this.loading.set(false);
      }
      return;
    }

    // No token at all
    this.loading.set(false);
    this.error.set("Vous n'êtes pas connecté.");
  }

  async refresh() {
    if (this.auth.isDemo()) return; // nothing to refresh offline
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.userService.loadMe();
      this.userSig.set(this.userService.value);
    } catch {
      this.error.set('Impossible de charger votre profil (API indisponible).');
    } finally {
      this.loading.set(false);
    }
  }

  onPickAvatar(src: string | null) {
    const u = this.userService.value;
    if (!u) return;
    const updated = { ...u };

    if (src) updated.avatar = src;
    else delete updated.avatar; // ← revenir aux initiales

    this.userService.setCurrentUser(updated);
    this.userSig.set(updated);
    this.showPicker = false;
  }

  removeAvatar() {
    const u = this.userService.value;
    if (!u) return;
    const { avatar, ...rest } = u as any;
    this.userService.setCurrentUser(rest);
    this.userSig.set(rest);
  }
  onCancelPick() {
    this.showPicker = false;
  }

  prettyRole(role: string): string {
    switch (role) {
      case 'ROLE_USER':
        return 'Utilisateur';
      case 'ROLE_ADMIN':
        return 'Administrateur';
      default:
        return role.replace(/^ROLE_/, '').toLowerCase();
    }
  }
}
