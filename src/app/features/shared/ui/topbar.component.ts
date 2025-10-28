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
        <a class="brand" routerLink="/home" aria-label="EcoRide">
          <img class="logo" src="/assets/illustrations/ecoride-logo.png" alt="" />
          <span class="wordmark">EcoRide</span>
        </a>

        <!-- Menu principal -->
        <nav id="mainmenu" class="menu" aria-label="Menu principal" [class.open]="open()">
          <a
            routerLink="/home"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            (click)="close()"
            >Accueil</a
          >
          <a routerLink="/profile" routerLinkActive="active" (click)="close()">Mon profil</a>
        </nav>

        <!-- Zone droite -->
        <div class="right">
          <ng-container *ngIf="userService.currentUser$ | async as u; else auth">
            <span class="user">{{
              u.prenom || u.nom ? u.prenom + ' ' + (u.nom ?? '') : u.email
            }}</span>
            <button class="logout" type="button" (click)="logout()">Déconnexion</button>
          </ng-container>
          <ng-template #auth>
            <a class="auth-link" routerLink="/login" (click)="close()">Connexion/Inscription</a>
          </ng-template>
        </div>
      </div>
    </header>

    <!-- Overlay (ferme le menu en mobile) -->
    <div class="overlay" *ngIf="open()" (click)="close()" aria-hidden="true"></div>
  `,
  styleUrls: ['./topbar.component.scss'],
})
export default class TopbarComponent implements OnDestroy {
  open = signal(false);
  private sub?: Subscription;

  constructor(private router: Router, private auth: AuthService, public userService: UserService) {
    // Ferme le menu à chaque navigation
    this.sub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.open.set(false));
  }

  toggle() {
    this.open.update((v) => !v);
  }
  close() {
    this.open.set(false);
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
