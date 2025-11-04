import { Routes } from '@angular/router';
import { authGuard } from './core/auth-guard';
import ForgotPasswordComponent from './features/auth/forgot-password/forgot-password.component';
import LoginComponent from './features/auth/login/login.component';
import RegisterComponent from './features/auth/register/register.component';
import HomeComponent from './features/home/home.component';
import ProfileComponent from './features/profile/profile.component';
import TripSearchComponent from './features/trips/trip-search.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },

  { path: 'home', component: HomeComponent },

  // Liste des trajets (si tu veux la rendre publique, enlève le guard)
  { path: 'trips', component: TripSearchComponent /* , canActivate: [authGuard] */ },

  // ⬇️ Détail AVANT le wildcard !
  {
    path: 'trips/:id',
    loadComponent: () =>
      import('./features/trips/trip-detail/trip-detail.component').then(
        (m) => m.TripDetailComponent
      ),
  },

  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },

  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' }, // ⬅️ toujours en dernier
];
