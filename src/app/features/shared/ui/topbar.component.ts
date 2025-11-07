import { CommonModule } from '@angular/common';
import { Component, OnDestroy, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="topbar">
      <div class="bar">
        <!-- Burger (mobile) -->
        <button
          class="burger"
          type="button"
          aria-label="Ouvrir le menu"
          aria-controls="mainmenu"
          [attr.aria-expanded]="open()"
          (click)="toggle()"
        >
          <span></span><span></span><span></span>
        </button>

        <!-- Logo / marque -->
        <div class="left-group">
          <a class="brand" routerLink="/home" aria-label="EcoRide">
            <img
              class="logo"
              src="assets/illustrations/Logo-ecoride.png"
              alt="EcoRide logo"
              (error)="fallbackLogo($event)"
            />
            <span class="wordmark">EcoRide</span>
          </a>

          <!-- Liens visibles SEULEMENT quand connecté -->
          <ng-container *ngIf="userService.currentUser$ | async as user">
            <!-- Masquer pour le compte admin -->
            <a
              class="nav-link"
              routerLink="/trips"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
              (click)="close()"
              *ngIf="!isSpecialAdmin(user)"
              >Rechercher un trajet</a
            >
            <a
              class="nav-link"
              routerLink="/profile"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
              (click)="close()"
              *ngIf="!isSpecialAdmin(user)"
              >Mon profil</a
            >
          </ng-container>
        </div>

        <div class="right">
          <ng-container *ngIf="userService.currentUser$ | async as u; else auth">
            <div class="user">
              <span class="name">{{ displayName(u) }}</span>
              <div class="avatar" aria-hidden="true">
                <img *ngIf="u.avatar; else initHeader" [src]="u.avatar" alt="Avatar" />
                <ng-template #initHeader>{{ initials(u) }}</ng-template>
              </div>
            </div>

            <button class="logout" type="button" (click)="logout()">Déconnexion</button>
          </ng-container>

          <ng-template #auth>
            <button class="logout" type="button" routerLink="/login">
              Connexion / Inscription
            </button>
          </ng-template>
        </div>
      </div>
    </header>

    <div class="overlay" *ngIf="open()" (click)="close()" aria-hidden="true"></div>
  `,
  styleUrls: ['./topbar.component.scss'],
})
export class TopbarComponent implements OnDestroy {
  open = signal(false);
  private sub?: Subscription;

  constructor(private router: Router, private auth: AuthService, public userService: UserService) {
    this.sub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.open.set(false));
  }

  // --- Masquage spécifique pour le compte admin ---
  isSpecialAdmin(user: { email?: string } | null | undefined): boolean {
    const email = (user?.email ?? '').trim().toLowerCase();
    return email === 'yoann@ecoride.com';
  }

  toggle() {
    this.open.update((v) => !v);
  }
  close() {
    this.open.set(false);
  }

  logout() {
    this.auth.logout(false);

    this.userService.clear();

    // Redirection vers l'accueil
    this.router.navigate(['/home']);
  }

  displayName(u: { prenom?: string; nom?: string; pseudo?: string; email: string }): string {
    if (u.pseudo && u.pseudo.trim()) return u.pseudo;
    const full = [u.prenom, u.nom].filter(Boolean).join(' ').trim();
    return full || u.email;
  }

  initials(u: { prenom?: string; nom?: string; pseudo?: string; email: string }): string {
    if (u.pseudo && u.pseudo.trim()) {
      const letters = u.pseudo.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, '').slice(0, 2);
      return letters.toUpperCase() || '?';
    }
    const p = u.prenom?.[0] ?? '';
    const n = u.nom?.[0] ?? '';
    const fb = u.email?.[0] ?? '?';
    return (p + n || fb).toUpperCase();
  }

  fallbackLogo(ev: Event) {
    const img = ev.target as HTMLImageElement;
    if (img) img.remove();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
